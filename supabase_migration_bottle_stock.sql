-- ============================================================
-- MIGRAÇÃO: Controle de Estoque Duplo para Garrafas
-- ============================================================

-- 1. Criar categoria fixa "Garrafa" se não existir
INSERT INTO categories (name) VALUES ('Garrafa') ON CONFLICT DO NOTHING;

-- 2. Adicionar colunas de controle duplo na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_bottles DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bottle_volume_ml DECIMAL(10,3);

-- 3. Atualizar trigger de abatimento de estoque
CREATE OR REPLACE FUNCTION deduct_stock_on_order() 
RETURNS TRIGGER AS $$
DECLARE
    prod_type TEXT;
    prod_category_name TEXT;
    prod_bottle_volume DECIMAL(10,3);
    ing_record RECORD;
    ing_category_name TEXT;
    ing_bottle_volume DECIMAL(10,3);
BEGIN
    -- Obter o tipo do produto
    SELECT p.type, c.name, p.bottle_volume_ml 
    INTO prod_type, prod_category_name, prod_bottle_volume
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = NEW.product_id;

    IF prod_type = 'simple' THEN
        IF prod_category_name = 'Garrafa' THEN
            -- Produto Garrafa vendido diretamente (combo/garrafa inteira)
            -- Abate garrafas inteiras E ml equivalente
            UPDATE products 
            SET stock_bottles = stock_bottles - NEW.quantity,
                stock = stock - (NEW.quantity * COALESCE(bottle_volume_ml, 0))
            WHERE id = NEW.product_id;
        ELSE
            -- Produto Simples normal
            UPDATE products 
            SET stock = stock - NEW.quantity 
            WHERE id = NEW.product_id;
        END IF;
        
    ELSIF prod_type = 'composition' THEN
        -- Produto Composto: Abater estoque dos ingredientes base
        FOR ing_record IN (SELECT pi.ingredient_id, pi.quantity FROM product_ingredients pi WHERE pi.product_id = NEW.product_id)
        LOOP
            -- Verificar se o ingrediente é Garrafa
            SELECT c.name, p.bottle_volume_ml 
            INTO ing_category_name, ing_bottle_volume
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ing_record.ingredient_id;

            IF ing_category_name = 'Garrafa' THEN
                -- Ingrediente é Garrafa: abate apenas ml (dose)
                UPDATE products 
                SET stock = stock - (ing_record.quantity * NEW.quantity)
                WHERE id = ing_record.ingredient_id;

                -- Recalcula garrafas inteiras = stock_ml / volume_garrafa
                IF ing_bottle_volume IS NOT NULL AND ing_bottle_volume > 0 THEN
                    UPDATE products
                    SET stock_bottles = FLOOR(stock / ing_bottle_volume)
                    WHERE id = ing_record.ingredient_id;
                END IF;
            ELSE
                -- Ingrediente normal
                UPDATE products 
                SET stock = stock - (ing_record.quantity * NEW.quantity)
                WHERE id = ing_record.ingredient_id;
            END IF;
        END LOOP;
        
    ELSIF prod_type = 'variable' THEN
        RAISE EXCEPTION 'Cannot add a variable parent product directly. Use its variation.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar trigger de restauração de estoque (cancelamento)
CREATE OR REPLACE FUNCTION restore_stock_on_cancel() 
RETURNS TRIGGER AS $$
DECLARE
    prod_type TEXT;
    prod_category_name TEXT;
    prod_bottle_volume DECIMAL(10,3);
    ing_record RECORD;
    ing_category_name TEXT;
    ing_bottle_volume DECIMAL(10,3);
BEGIN
    SELECT p.type, c.name, p.bottle_volume_ml 
    INTO prod_type, prod_category_name, prod_bottle_volume
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = OLD.product_id;

    IF prod_type = 'simple' THEN
        IF prod_category_name = 'Garrafa' THEN
            UPDATE products 
            SET stock_bottles = stock_bottles + OLD.quantity,
                stock = stock + (OLD.quantity * COALESCE(bottle_volume_ml, 0))
            WHERE id = OLD.product_id;
        ELSE
            UPDATE products 
            SET stock = stock + OLD.quantity 
            WHERE id = OLD.product_id;
        END IF;
        
    ELSIF prod_type = 'composition' THEN
        FOR ing_record IN (SELECT pi.ingredient_id, pi.quantity FROM product_ingredients pi WHERE pi.product_id = OLD.product_id)
        LOOP
            SELECT c.name, p.bottle_volume_ml 
            INTO ing_category_name, ing_bottle_volume
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ing_record.ingredient_id;

            IF ing_category_name = 'Garrafa' THEN
                UPDATE products 
                SET stock = stock + (ing_record.quantity * OLD.quantity)
                WHERE id = ing_record.ingredient_id;

                IF ing_bottle_volume IS NOT NULL AND ing_bottle_volume > 0 THEN
                    UPDATE products
                    SET stock_bottles = FLOOR(stock / ing_bottle_volume)
                    WHERE id = ing_record.ingredient_id;
                END IF;
            ELSE
                UPDATE products 
                SET stock = stock + (ing_record.quantity * OLD.quantity)
                WHERE id = ing_record.ingredient_id;
            END IF;
        END LOOP;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

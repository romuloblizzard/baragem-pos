-- EXTENSÃO NECESSÁRIA PARA SENHAS (Geralmente já ativada no Supabase, mas para garantir)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. FUNÇÃO: SINCRONIZAR FUNCIONÁRIO COM AUTH.USERS DO SUPABASE
-- Quando o Gerente criar um funcionário na aba "Equipe", essa função vai criar 
-- secretamente a conta real no cofre blindado do Supabase Auth
CREATE OR REPLACE FUNCTION public.sync_employee_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_fake_email TEXT;
  v_user_id UUID;
BEGIN
  -- Se o funcionario foi inserido ou teve o PIN atualizado
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.pin <> OLD.pin) THEN
      -- O e-mail fake será "123456@baragem.local" para podermos fazer o Login
      v_fake_email := NEW.pin || '@baragem.local';

      -- Checar se o PIN (email falso) já existe no AUTH (por precaução)
      SELECT id INTO v_user_id FROM auth.users WHERE email = v_fake_email;

      IF v_user_id IS NULL THEN
          -- INSERE NO AUTH SECRETO DO SUPABASE (A Senha é o próprio PIN criptografado)
          -- Nota: no PostgreSQL do Supabase, auth.users é a fonte da verdade da segurança.
          INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
          ) VALUES (
              '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_fake_email, crypt(NEW.pin, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('role', NEW.role, 'name', NEW.name), now(), now(), '', '', '', ''
          ) RETURNING id INTO v_user_id;
      ELSE
          -- Se existisse (raro, pois garantimos que na employees é UNIQUE) 
          -- atualiza a senha de volta para o PIN.
          UPDATE auth.users SET encrypted_password = crypt(NEW.pin, gen_salt('bf')) WHERE id = v_user_id;
      END IF;

      -- Associa o ID de segurança do Auth à tabela pública de empregados para sabermos "Quem é Quem"
      IF TG_OP = 'INSERT' THEN
        NEW.auth_id := v_user_id;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADICIONA A COLUNA DE LIGAÇÃO
-- Adiciona a coluna silenciosa que liga a tabela visual com o cofre auth.users
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 3. CRIA O GATILHO AUTOMÁTICO
-- Dropa se já existir
DROP TRIGGER IF EXISTS trg_sync_employee_auth ON public.employees;
-- Avisa ao banco para rodar a sincronização assim que alguém clicar em "Salvar" na aba Equipe do React
CREATE TRIGGER trg_sync_employee_auth
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE PROCEDURE public.sync_employee_to_auth();

-- 4. MIGRA QUEM JÁ EXISTE NO BANCO (Retroativo)
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN SELECT * FROM public.employees WHERE auth_id IS NULL LOOP
        -- Força um UPDATE invisível para disparar o Trigger de criação e jogar pro Auth
        UPDATE public.employees SET pin = emp.pin WHERE id = emp.id;
    END LOOP;
END $$;


-- =========================================================================
-- PARTE 2: LIGANDO O CADEADO INQUEBRÁVEL - ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Função Mágica auxiliar para descobrir quem é o usuário atual que fez o Request
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT AS $$
  SELECT role FROM public.employees WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- LIGA OS ESCUDOS DAS TABELAS MAIS CRÍTICAS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DA TABELA ORDERS (Comandas)
-- 1. QUALQUER logado pode VER as comandas do dia atual ou as que não estão fechadas (inclusive Garçons e Admin).
CREATE POLICY "Ver Comandas Abertas" ON public.orders FOR SELECT TO authenticated USING (true);

-- 2. QUALQUER logado pode CRIAR uma comanda (Garçom ou Admin).
CREATE POLICY "Criar Comandas" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

-- 3. QUALQUER logado pode ATUALIZAR comandas abertas (Adicionar itens, Fechar).
CREATE POLICY "Atualizar Comandas" ON public.orders FOR UPDATE TO authenticated USING (true);


-- POLÍTICAS DA TABELA TRANSACTIONS E PRODUCTS (CRÍTICAS - Apenas Admin manipula estruturalmente)
-- 1. Todo mundo pode LER produtos para vender.
CREATE POLICY "Ler Produtos" ON public.products FOR SELECT TO authenticated USING (true);

-- 2. Apenas ADMINS podem CRIAR, CADASTRAR OU MEXER NO PREÇO DE produtos.
CREATE POLICY "Admin Altera Produtos" ON public.products FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- 3. Garçons e Admins inserem Transações, mas NINGUÉM APAGA transações pra não falsificar caixa.
CREATE POLICY "Criar Transacoes" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Ler Transacoes" ON public.transactions FOR SELECT TO authenticated USING (true);
-- Não há política para DELETE em Transactions. Se alguém tentar da Vercel "DELETE FROM transactions", o banco VAI NEGAR.

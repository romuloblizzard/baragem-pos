-- Adiciona o campo de requisição de impressão de conferência na tabela de comandas
-- Execute este SQL no painel do Supabase > SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS conference_print_requested BOOLEAN DEFAULT false;

COMMENT ON COLUMN orders.conference_print_requested IS 
'Quando true, o servidor de impressão (PrintQueue) gera e imprime automaticamente a conferência da comanda, sem diálogo no navegador.';

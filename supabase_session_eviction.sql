-- 1. Adicionar o rastreador de sessão ativa (Dispositivo) na tabela de Funcionários
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS current_device_id TEXT;

-- 2. Ativar a transmissão em Tempo Real (Realtime) para a tabela de Funcionários
-- Isso permite que o Frontend React escute instantaneamente quando a coluna current_device_id for atualizada!
DO $$
BEGIN
    -- Checa se a tabela já está no Publicador do Realtime. Senão, adiciona.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'employees'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
    END IF;
END
$$;

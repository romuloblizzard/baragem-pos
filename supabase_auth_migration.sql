-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'waiter')),
    pin TEXT NOT NULL UNIQUE, -- Unique 6-digit PIN
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Tentativas de Login (Rate Limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_or_device TEXT NOT NULL,
    attempts_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(ip_or_device)
);

-- Inserir usuário Admin padrão caso a tabela esteja vazia (Senha 123456)
INSERT INTO public.employees (name, role, pin)
SELECT 'Gerente Principal', 'admin', '123456'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE role = 'admin');

-- Inserir usuário Garçom padrão caso a tabela esteja vazia (Senha 999999)
INSERT INTO public.employees (name, role, pin)
SELECT 'Garçom Teste', 'waiter', '999999'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE role = 'waiter');

-- Função RPC para Login Seguro via PIN com Rate Limit
CREATE OR REPLACE FUNCTION public.login_with_pin(
    entered_pin TEXT,
    client_identifier TEXT -- Pode ser IP, user-agent ou um UUID gerado no frontend
) RETURNS json AS $$
DECLARE
    v_attempts RECORD;
    v_employee RECORD;
    v_max_attempts INT := 5;
    v_lockout_minutes INT := 5;
BEGIN
    -- 1. Checar tentativas anteriores (Rate Limit)
    SELECT * INTO v_attempts FROM public.login_attempts WHERE ip_or_device = client_identifier;
    
    IF FOUND THEN
        -- Se falhou mais do que o limite e ainda está no período de bloqueio
        IF v_attempts.attempts_count >= v_max_attempts AND (now() - v_attempts.last_attempt) < (v_lockout_minutes || ' minutes')::interval THEN
            RETURN json_build_object(
                'success', false, 
                'error', 'Você errou a senha muitas vezes. Tente novamente em ' || v_lockout_minutes || ' minutos.'
            );
        END IF;
        
        -- Se o período de bloqueio passou, reseta a contagem
        IF (now() - v_attempts.last_attempt) >= (v_lockout_minutes || ' minutes')::interval THEN
            UPDATE public.login_attempts 
            SET attempts_count = 0, last_attempt = now()
            WHERE ip_or_device = client_identifier;
        END IF;
    END IF;

    -- 2. Procurar o funcionário pelo PIN e garantir que está ativo
    SELECT * INTO v_employee FROM public.employees WHERE pin = entered_pin AND active = true;

    -- 3. Se o PIN estiver Errado
    IF NOT FOUND THEN
        -- Incrementa ou cria tentativa
        INSERT INTO public.login_attempts (ip_or_device, attempts_count, last_attempt)
        VALUES (client_identifier, 1, now())
        ON CONFLICT (ip_or_device) DO UPDATE 
        SET attempts_count = login_attempts.attempts_count + 1, last_attempt = now();
        
        RETURN json_build_object(
            'success', false, 
            'error', 'PIN Incorreto.'
        );
    END IF;

    -- 4. Se o PIN estiver Certo: Limpa as falhas
    DELETE FROM public.login_attempts WHERE ip_or_device = client_identifier;

    -- 5. Retorna o sucesso e os dados
    RETURN json_build_object(
        'success', true,
        'role', v_employee.role,
        'name', v_employee.name,
        'employee_id', v_employee.id
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

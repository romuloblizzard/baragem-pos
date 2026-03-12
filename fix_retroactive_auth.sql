DO $$
DECLARE
    emp RECORD;
    v_user_id UUID;
BEGIN
    FOR emp IN SELECT * FROM public.employees WHERE auth_id IS NULL LOOP
        -- Tenta encontrar o usuário na tabela auth.users pelo email fictício
        SELECT id INTO v_user_id FROM auth.users WHERE email = (emp.pin || '@baragem.local');
        
        IF v_user_id IS NOT NULL THEN
            UPDATE public.employees SET auth_id = v_user_id WHERE id = emp.id;
        ELSE
            -- Cria o usuário se por algum motivo não foi criado
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', emp.pin || '@baragem.local', crypt(emp.pin, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('role', emp.role, 'name', emp.name), now(), now(), '', '', '', ''
            ) RETURNING id INTO v_user_id;
            
            UPDATE public.employees SET auth_id = v_user_id WHERE id = emp.id;
        END IF;
    END LOOP;
END $$;

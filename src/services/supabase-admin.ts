import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com service_role key.
 * ATENÇÃO: Bypassa todas as políticas RLS.
 * Usar SOMENTE no serviço de impressão (PrintQueue).
 * NUNCA expor esta chave publicamente.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[supabase-admin] Chave service_role ausente. Verifique o arquivo .env.local');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

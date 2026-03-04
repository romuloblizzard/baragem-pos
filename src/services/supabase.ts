import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return process.env[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As credenciais do Supabase estāo ausentes. Verifique o arquivo .env.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return process.env[key];
};

const cloudUrl = getEnv('VITE_SUPABASE_URL');
const cloudAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const localUrl = getEnv('VITE_SUPABASE_URL_LOCAL');
const localAnonKey = getEnv('VITE_SUPABASE_ANON_KEY_LOCAL');

if (!cloudUrl || !cloudAnonKey) {
  throw new Error('As credenciais do Supabase estāo ausentes. Verifique o arquivo .env.');
}

// Cliente padrão (nuvem) -- garante que `supabase` nunca fica indefinido, mesmo antes
// da checagem de conectividade local terminar.
export let supabase: SupabaseClient = createClient(cloudUrl, cloudAnonKey);

// Se este build tiver credenciais de uma instância local configurada, tenta usá-la
// primeiro (mais rápido, funciona sem internet). Se não responder rápido, mantém a nuvem.
// `initSupabase()` é aguardado no boot do app (main.tsx) antes de renderizar, para que
// nenhuma tela chegue a disparar uma chamada com o cliente errado.
export async function initSupabase(): Promise<void> {
  if (!localUrl || !localAnonKey) return;

  // Só tenta o local se a própria página foi carregada a partir do IP da rede local
  // (evita 1.5s de atraso à toa para quem acessa via Cloudflare de fora da LAN).
  if (typeof window !== 'undefined') {
    try {
      if (window.location.hostname !== new URL(localUrl).hostname) return;
    } catch {
      return;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${localUrl}/rest/v1/`, {
      headers: { apikey: localAnonKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status < 500) {
      supabase = createClient(localUrl, localAnonKey);
      console.info('[supabase] usando instância local (LAN)');
      return;
    }
  } catch {
    // instância local inalcançável -- segue na nuvem
  }
  console.info('[supabase] usando instância na nuvem');
}

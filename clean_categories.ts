import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Autenticando...');
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: '123456@baragem.local',
    password: '123456'
  });

  if (authError) {
    console.error('Falha:', authError);
    return;
  }

  const { data: categories } = await supabase.from('categories').select('*');
  for (const cat of categories || []) {
    const cleanName = cat.name.replace(/^[🟡🟢🔵🟠🟣🔴⚫]\s*(?:[0-9]+\.\s*)?/, '').trim();
    if (cleanName !== cat.name) {
      console.log(`Renomeando: ${cat.name} -> ${cleanName}`);
      await supabase.from('categories').update({ name: cleanName }).eq('id', cat.id);
    }
  }
  console.log('Concluído!');
}

run();

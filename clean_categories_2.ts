import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: '123456@baragem.local',
    password: '123456'
  });

  const { data: categories } = await supabase.from('categories').select('*');
  for (const cat of categories || []) {
    // Apagar tudo que vem antes da primeira letra de A-Z (maiúscula/minúscula)
    const match = cat.name.match(/[A-Za-zÀ-ÿ]/);
    if (match) {
        const idx = cat.name.indexOf(match[0]);
        let cleanName = cat.name.substring(idx).trim();
        if (cleanName !== cat.name) {
            console.log(`Limpando: ${cat.name} -> ${cleanName}`);
            await supabase.from('categories').update({ name: cleanName }).eq('id', cat.id);
        }
    }
  }
}
run();

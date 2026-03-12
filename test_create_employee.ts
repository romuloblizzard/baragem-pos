import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
    await supabase.auth.signInWithPassword({ email: '123456@baragem.local', password: '123456' });

    const { data, error } = await supabase.from('products').select('id, name, type, parent_id, active').order('name');
    if (error) { console.error(error); return; }

    console.log('All products:');
    console.table(data);

    const children = data?.filter(p => p.parent_id);
    console.log('\nProducts with parent_id (variations):');
    console.table(children);

    const simples = data?.filter(p => p.type === 'simple' && p.active);
    console.log('\nSimple + Active (should appear as ingredients):');
    console.table(simples);
}

check();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
    const { data, error } = await supabase.from('employees').select('name, pin, role, auth_id, active');
    if (error) console.error(error);
    else console.table(data);
}
check();

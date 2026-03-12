import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// We cannot create employees from the client unless RLS is disabled or we have service role.
// We previously disabled RLS on employees, so we can.
async function testInsert() {
    const pin = '888888';
    console.log('Inserting new employee...');
    const { error: insErr } = await supabase.from('employees').insert([{ name: 'Teste Trigger', role: 'waiter', pin }]);
    if (insErr) console.error(insErr);

    const { data, error } = await supabase.from('employees').select('name, pin, auth_id').eq('pin', pin).single();
    if (error) console.error(error);
    else console.table(data);

}
testInsert();

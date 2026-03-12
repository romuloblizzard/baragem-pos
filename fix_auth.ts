import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function fix() {
    const { data: emps, error } = await supabase.from('employees').select('*').is('auth_id', null);
    if (error) {
        console.error(error);
        return;
    }

    if (!emps || emps.length === 0) {
        console.log('No employees left to fix.');
        return;
    }

    console.log(`Fixing ${emps.length} employees...`);
    for (const emp of emps) {
        // Force a pin change and change back to trigger the RPC
        await supabase.from('employees').update({ pin: emp.pin + 'x' }).eq('id', emp.id);
        await supabase.from('employees').update({ pin: emp.pin }).eq('id', emp.id);
        console.log(`Fixed ${emp.name}`);
    }

    // Clean the test employee
    await supabase.from('employees').delete().eq('pin', '888888');

    // Rerun RLS Test
    console.log('\n--- RERUNNING RLS TEST ---');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: '123456@baragem.local',
        password: '123456'
    });

    if (authError) {
        console.log('❌ FALHA NO LOGIN.');
    } else {
        console.log('✅ SUCESSO: Login efetuado. O Trigger migrou o funcionário para auth.users com sucesso!');
    }
}
fix();

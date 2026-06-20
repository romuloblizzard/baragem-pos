import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    console.log('Testing login for Larissa Alves (PIN: 051274)...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: '051274@baragem.local',
        password: '051274'
    });
    if (error) {
        console.error('? LOGIN FAILED!');
        console.error('Error Code:', error.status);
        console.error('Error Message:', error.message);
        return;
    }
    console.log('? LOGIN SUCCESS!');
    console.log('User:', data.user.email);
}
testLogin();

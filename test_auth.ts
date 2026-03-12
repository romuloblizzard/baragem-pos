import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('Testing Employee Fetch...');
    try {
        const { data: employees, error: err1 } = await supabase.from('employees').select('*');
        if (err1) throw err1;
        console.log(`✅ Fetched ${employees.length} employees`);
        console.table(employees);

        console.log('\nTesting Login RPC with correct Admin PIN (123456)...');
        const { data: authData1, error: authErr1 } = await supabase.rpc('login_with_pin', {
            entered_pin: '123456',
            client_identifier: 'test-device-1'
        });
        if (authErr1) throw authErr1;
        console.log('✅ RPC Result (Correct PIN):', authData1);

        console.log('\nTesting Login RPC with WRONG PIN (000000)...');
        const { data: authData2, error: authErr2 } = await supabase.rpc('login_with_pin', {
            entered_pin: '000000',
            client_identifier: 'test-device-1'
        });
        if (authErr2) throw authErr2;
        console.log('✅ RPC Result (Wrong PIN):', authData2);

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAuth();

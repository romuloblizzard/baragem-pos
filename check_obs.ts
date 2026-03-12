import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function addObservation() {
    const { error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS observation TEXT;' });
    if (error) {
        console.log("RPC might not exist, trying an insert to see if the column is there:", error.message);
        const { error: insertError } = await supabase.from('products').insert({ name: 'test_obs', price: 0, observation: 'test' }).select().single();
        if (insertError && insertError.code === '42703') {
            console.log("Column truly does not exist. We need to run it via supabase JS client if possible... wait we can't do ALTER TABLE directly from JS client unless via RPC. Let's just create a SQL file and remind the user to run it if it fails.");
        } else {
            console.log("Column might exist or another error occurred:", insertError);
            if (!insertError) {
                await supabase.from('products').delete().eq('name', 'test_obs');
            }
        }
    } else {
        console.log("Migration successful");
    }
}

addObservation();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing SUPABASE credentials in .env");
    process.exit(1);
}

const supabase = createClient(url, key);

async function clean() {
    console.log("Limpando Transactions...");
    await supabase.from('transactions').delete().neq('id', 0);
    console.log("Limpando order_items...");
    await supabase.from('order_items').delete().neq('id', 0);
    console.log("Limpando orders...");
    await supabase.from('orders').delete().neq('id', 0);
    console.log("Limpando cashier_sessions...");
    await supabase.from('cashier_sessions').delete().neq('id', 0);
    console.log("Limpando customers...");
    await supabase.from('customers').delete().neq('id', 0);
    console.log("Tudo limpo!");
}

clean();

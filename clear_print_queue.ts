import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearQueue() {
    console.log('Limpando a fila de ingressos da cozinha (order_items)...');
    const { data: tickets, error: err1 } = await supabase
        .from('order_items')
        .update({ printed: true })
        .eq('printed', false)
        .select('id');
    
    if (err1) {
        console.error('Erro ao limpar tickets:', err1);
    } else {
        console.log(`Sucesso: ${tickets?.length || 0} tickets da cozinha foram marcados como impressos.`);
    }

    console.log('\nLimpando a fila de recibos de fechamento (orders)...');
    const { data: receipts, error: err2 } = await supabase
        .from('orders')
        .update({ receipt_printed: true })
        .eq('receipt_printed', false)
        .select('id');
    
    if (err2) {
        console.error('Erro ao limpar recibos:', err2);
    } else {
        console.log(`Sucesso: ${receipts?.length || 0} recibos antigos foram marcados como impressos.`);
    }
}

clearQueue();

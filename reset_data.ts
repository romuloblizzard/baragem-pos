import { supabase } from './src/services/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function resetData() {
    console.log('Iniciando limpeza dos dados de teste...');

    try {
        console.log('1. Apagando Transações...');
        await supabase.from('transactions').delete().neq('id', 0);

        console.log('2. Apagando Itens de Comanda (Restaurando Estoque via Trigger)...');
        await supabase.from('order_items').delete().neq('id', 0);

        console.log('3. Apagando Comandas...');
        await supabase.from('orders').delete().neq('id', 0);

        console.log('4. Apagando Sessões de Caixa...');
        await supabase.from('cashier_sessions').delete().neq('id', 0);

        console.log('5. Apagando Clientes de Teste...');
        await supabase.from('customers').delete().neq('id', 0);

        console.log('✅ Banco de dados limpo com sucesso!');
    } catch (err: any) {
        console.error('❌ Erro ao limpar banco:', err.message);
    }
}

resetData();

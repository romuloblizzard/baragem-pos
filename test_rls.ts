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

async function testRLS() {
    console.log('--- TESTE DE SEGURANÇA E RLS ---');

    // 1. Tentar ler Produtos SEM AUTENTICAÇÃO (Deve falhar se RLS = TRUE e Anon não tiver policy)
    // Mas de acordo com as regras criadas, Authenticated tem. Anon NÃO tem.
    console.log('\n1. Lendo Produtos como Anônimo (Sem estar logado)...');
    const { data: anonProds, error: anonErr } = await supabase.from('products').select('*').limit(1);
    if (anonProds && anonProds.length > 0) {
        console.log('⚠️ ALERTA: Leitura anônima de Produtos PERMITIDA. (RLS Falhou ou Política Permissiva)');
    } else if (anonErr || anonProds?.length === 0) {
        console.log('✅ SUCESSO: Leitura anônima de Produtos BLOQUEADA/VAZIA pelo RLS.');
    }

    // 2. Fazer Login como ADMIN
    console.log('\n2. Efetuando Login como Admin Principal (123456)...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: '123456@baragem.local',
        password: '123456'
    });

    if (authError) {
        console.log('❌ FALHA NO LOGIN: O Trigger do Supabase pode não ter criado o email falso em auth.users.');
        console.error(authError.message);
        return;
    }
    console.log('✅ SUCESSO: Login efetuado. O Trigger migrou o funcionário para auth.users com sucesso!');
    console.log('Sessão JWT Recebida e ativa:', authData.session?.access_token.substring(0, 15) + '...');

    // 3. Tentar ler as Comandas LOGADO
    console.log('\n3. Lendo Comandas como Admin Autenticado...');
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('id').limit(1);
    if (ordersErr) {
        console.log('❌ FALHA AO LER COMANDAS: RLS ou Configuração de Política Errada.', ordersErr);
    } else {
        console.log('✅ SUCESSO: Comandas Lidas via RLS Token.');
    }

    // Deslogar
    await supabase.auth.signOut();
    console.log('\n=== TESTES CONCLUÍDOS ===');
}

testRLS();

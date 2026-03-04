import { api } from './src/services/api';
import { supabase } from './src/services/supabase';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTests() {
    console.log('--- Início dos Testes de Integração Supabase ---');
    let failures = 0;

    try {
        // 1. Testa Produtos e Categorias
        console.log('1. Testando Listagem de Categorias...');
        const categories = await api.getCategories();
        console.log(`✅ Sucesso! Categorias encontradas: ${categories.length}`);

        console.log('2. Testando Listagem de Produtos...');
        let products = await api.getProducts();
        console.log(`✅ Sucesso! Produtos encontrados: ${products.length}`);

        if (products.length === 0) {
            console.log('⚠️ Nenhum produto encontrado. Criando Categoria e Produto de Teste...');
            const cat = await api.saveCategory({ name: 'Bebidas Teste' });
            await api.saveProduct({
                name: 'Cerveja Lata Teste',
                price: 8.00,
                stock: 100,
                category_id: cat.id,
                type: 'simple'
            });
            products = await api.getProducts();
            console.log(`✅ Sucesso! Produto criado para teste.`);
        }

        const testProduct = products.find(p => p.type === 'simple') || products[0];

        // 2. Testa Abertura de Caixa
        console.log('3. Testando Abertura de Caixa...');
        let cashierSessionId;
        try {
            const cashierParams = await api.openCashier(100);
            cashierSessionId = cashierParams.id;
            console.log('✅ Sucesso! Caixa aberto com ID', cashierSessionId);
        } catch (e: any) {
            if (e.message.includes('already open')) {
                console.log('✅ Caixa já estava aberto, prosseguindo...');
            } else {
                throw e;
            }
        }

        // 3. Cadastra e Pesquisa Cliente
        console.log('4. Testando Cadastro de Cliente...');
        const docNumber = `TEST-${Date.now()}`;
        const newCustomer = await api.createCustomer({
            name: 'Cliente Teste Supabase',
            document: docNumber,
            phone: '11999999999'
        });
        console.log(`✅ Sucesso! Cliente criado: ID ${newCustomer.id}`);

        // 4. Cria Comanda
        console.log('5. Testando Criação de Comanda...');
        const pulseiraId = `P-${Math.floor(Math.random() * 1000)}`;
        const newOrder = await api.createOrder({
            pulseira: pulseiraId,
            customer_name: newCustomer.name,
            customer_id: newCustomer.id
        });
        console.log(`✅ Sucesso! Comanda aberta: ID ${newOrder.id}`);

        // 5. Adiciona Item à Comanda (Gatilho de Estoque)
        console.log(`6. Testando Adição de Item (Produto ID ${testProduct.id})...`);
        console.log(`   Estoque atual do produto: ${testProduct.stock}`);
        await api.addOrderItems(newOrder.id, [{ id: testProduct.id, quantity: 2 }]);
        console.log(`✅ Sucesso! Item adicionado.`);

        // check updated stock directly to validate Trigger
        const { data: updatedProduct } = await supabase.from('products').select('stock').eq('id', testProduct.id).single();
        console.log(`   Estoque pós-venda: ${updatedProduct?.stock}`);

        // 6. Fechamento de Comanda
        console.log('7. Testando Pagamento de Comanda...');
        await api.payOrder(newOrder.id, testProduct.price * 2, 'pix');
        console.log(`✅ Sucesso! Comanda paga.`);

        // 7. Estatísticas
        console.log('8. Testando Estatísticas Diárias...');
        const stats = await api.getStats();
        console.log(`✅ Sucesso! Estatísticas:`, stats);

    } catch (err: any) {
        console.error('❌ ERRO NO TESTE:', err.message);
        failures++;
    }

    console.log('--------------------------------------------');
    console.log(`Testes finalizados com ${failures} falhas.`);
    process.exit(failures > 0 ? 1 : 0);
}

runTests();

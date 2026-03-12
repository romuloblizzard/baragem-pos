import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
    // Login as admin
    await supabase.auth.signInWithPassword({ email: '123456@baragem.local', password: '123456' });

    // Get a composition product
    const { data: compositions } = await supabase.from('products').select('id, name, type').eq('type', 'composition');
    console.log('Composition products:', compositions);

    if (!compositions || compositions.length === 0) {
        console.log('No composition products found');
        return;
    }

    const compId = compositions[0].id;

    // Check existing ingredients
    const { data: existing, error: readErr } = await supabase.from('product_ingredients').select('*').eq('product_id', compId);
    console.log('Existing ingredients for', compositions[0].name, ':', existing, 'Error:', readErr);

    // Try to insert a test ingredient
    const { data: simples } = await supabase.from('products').select('id, name').eq('type', 'simple').limit(1);
    if (!simples?.length) { console.log('No simple products'); return; }

    console.log('Trying to insert ingredient', simples[0].name, 'into', compositions[0].name);
    const { data: insertResult, error: insertErr } = await supabase.from('product_ingredients').insert({
        product_id: compId,
        ingredient_id: simples[0].id,
        quantity: 1
    }).select();

    console.log('Insert result:', insertResult);
    console.log('Insert error:', insertErr);

    // Cleanup if success
    if (insertResult?.[0]) {
        await supabase.from('product_ingredients').delete().eq('id', insertResult[0].id);
        console.log('Cleaned up test ingredient');
    }
}

test();

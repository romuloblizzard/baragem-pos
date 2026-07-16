const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
    const q1 = await supabase.from('orders').select('*, items:order_items(*, products(name, parent_id, parent:parent_id(name)), modifiers:order_item_modifiers(product:products(name)))').eq('status', 'paid').limit(1);
    console.log("Q1 Error:", q1.error);

    const q2 = await supabase.from('orders').select('*, items:order_items(*, products(name, parent_id, parent:parent_id(name)), modifiers:order_item_modifiers(product:products(name)))').eq('conference_print_requested', true).limit(1);
    console.log("Q2 Error:", q2.error);

    const q3 = await supabase.from('order_items').select(`
            id, 
            quantity, 
            created_at, 
            attendant_name,
            products(name, categories(name), parent_id, parent:parent_id(name)),
            orders(pulseira, customer_name),
            modifiers:order_item_modifiers(product:products(name))
          `).eq('printed', false).limit(1);
    console.log("Q3 Error:", q3.error);
}
test();

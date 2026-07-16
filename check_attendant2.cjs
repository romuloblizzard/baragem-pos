const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function check() {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id, quantity, 
        products(name, parent_id, parent:parent_id(name)), 
        orders(pulseira, customer_name), 
        attendant_name,
        modifiers:order_item_modifiers(product:products(name))
      `)
      .order('created_at', { ascending: false })
      .limit(1);
    console.log(JSON.stringify(items[0], null, 2));
}
check();

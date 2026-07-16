const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        id, 
        quantity, 
        products(name, parent_id, parent:products(name)), 
        orders(pulseira)
      `)
      .in('id', [2191, 2190, 2189, 2188]) // recent orders
      .order('id', { ascending: false })
      .limit(3);

    console.log(JSON.stringify(items, null, 2));
}
test();

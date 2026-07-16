const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
  const { data: items } = await supabase.from('order_items').select('*, products(name)').order('id', {ascending: false}).limit(1);
  console.log('Last order item:', JSON.stringify(items, null, 2));
  
  const { data: mods } = await supabase.from('order_item_modifiers').select('*').eq('order_item_id', items[0].id);
  console.log('Modifiers for last item:', JSON.stringify(mods, null, 2));
}
test();

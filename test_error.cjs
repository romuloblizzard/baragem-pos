const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
    const { data: confData, error: confError } = await supabase
      .from('orders')
      .select('*, items:order_items(*, products(name, parent_id, parent:parent_id(name)), modifiers:order_item_modifiers(product:products(name)))')
      .eq('conference_print_requested', true)
      .order('created_at', { ascending: true })
      .limit(1);

    console.log("Error:", confError);
}
test();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function check() {
    const { data: items } = await supabase.from('products').select('id, name, cost_price, stock').eq('stock', 0).eq('type', 'simple').is('cost_price', null);
    console.log(items);
}
check();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
  const { data: groups } = await supabase.from('product_modifier_groups').select('*').eq('product_id', 418);
  console.log('Modifier groups for SAQUE CAIPORA (418):', JSON.stringify(groups, null, 2));
  
  const { data: groups509 } = await supabase.from('product_modifier_groups').select('*').eq('product_id', 509);
  console.log('Modifier groups for Drink fred (509):', JSON.stringify(groups509, null, 2));
}
test();

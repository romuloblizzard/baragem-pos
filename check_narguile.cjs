const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function checkNarguile() {
    const { data: prods } = await supabase.from('products').select('*').in('category_id', [46, 95]);
    console.log(`Found ${prods.length} products in Narguile categories:`);
    prods.forEach(p => {
        console.log(`- [${p.id}] ${p.name} | Active: ${p.active} | Stock: ${p.stock}`);
    });
}
checkNarguile();

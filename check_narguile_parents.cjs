const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function checkNarguile() {
    const { data: prods } = await supabase.from('products').select('*').in('category_id', [46, 95]);
    console.log(`Active Essences with their parent_id:`);
    prods.filter(p => p.active && p.name.toLowerCase().includes('essenc') || p.name.toLowerCase().includes('essênc')).forEach(p => {
        console.log(`- [${p.id}] ${p.name} | Category: ${p.category_id} | Type: ${p.type} | Parent: ${p.parent_id}`);
    });
}
checkNarguile();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function test() {
    const q2 = await supabase.from('orders').select('*').eq('conference_print_requested', true);
    console.log("Pending conferences:", q2.data.length);
}
test();

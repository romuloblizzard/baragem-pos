const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rlhdguvhenpfxmrsrcjl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsaGRndXZoZW5wZnhtcnNyY2psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzODQwOCwiZXhwIjoyMDg4MjE0NDA4fQ.bTrc9_FI3RTj0BJ-0VPT_yiCr_2QZarZwDNL2-ICaw0');

async function checkProducts() {
    // Buscar categorias relacionadas a 'essencia' ou 'essências'
    const { data: categories } = await supabase.from('categories').select('*').ilike('name', '%essen%');
    console.log("Categories found:", categories);

    if (categories && categories.length > 0) {
        for (const cat of categories) {
            console.log(`\n--- Products in Category: ${cat.name} ---`);
            const { data: prods, error } = await supabase.from('products').select('*').eq('category_id', cat.id);
            if (error) {
                console.error("Error fetching products:", error);
            } else {
                console.log(`Found ${prods.length} products:`);
                prods.forEach(p => {
                    console.log(`- [${p.id}] ${p.name} (Active: ${p.active !== undefined ? p.active : 'N/A'}, Stock: ${p.stock_quantity !== undefined ? p.stock_quantity : 'N/A'}, Parent: ${p.parent_id})`);
                });
            }
        }
    } else {
       // Just list some products to see what we have
       const { data: allProds } = await supabase.from('products').select('*').limit(5);
       console.log("No essence category found. Here are some products:", allProds);
    }
}
checkProducts();

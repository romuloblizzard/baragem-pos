import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabase } from './src/services/supabase';
import { api } from './src/services/api';

const newStructure = [
  { p: '🟡 1. COMIDAS', subs: ['Lanches', 'Espetos (Venda Unitária)', 'Porções'] },
  { p: '🟢 2. BEBIDAS (ALCOOL)', subs: ['Cervejas (Lata/LN)', 'Baldes (Combos)', 'Especiais (Ice/Beats)'] },
  { p: '🔵 3. BEBIDAS (SEM ALCOOL)', subs: ['Águas & H2O', 'Refrigerantes (Lata)', 'Energéticos', 'Sucos & Chás'] },
  { p: '🟢 4. CAIPIRINHAS', subs: ['Caipirinhas de Limão', 'Caipirinhas de Morango', 'Caipirinhas de Maracujá'] },
  { p: '🟠 5. DRINKS & DOSES', subs: ['Copões & Mix', 'Doses Individuais'] },
  { p: '🟣 6. COMBOS DE GARRAFA', subs: [] }, // No explicit subcategories mentioned, default to root or create a placeholder
  { p: '🔴 7. GARRAFAS AVULSAS', subs: ['Whiskys (Garrafa Fechada)', 'Gins (Garrafa Fechada)', 'Licores & Aperitivos (Garrafa Fechada)'] },
  { p: '⚫ 8. LAZER / NARGUILÉ', subs: [] },
];

const exactMappings: Record<string, { parent: string; sub?: string }> = {
  // Comidas
  'Espetinho Bovino': { parent: '🟡 1. COMIDAS', sub: 'Espetos (Venda Unitária)' },
  'Espetinho de Frango': { parent: '🟡 1. COMIDAS', sub: 'Espetos (Venda Unitária)' },
  'Espetinho Meio da Asa': { parent: '🟡 1. COMIDAS', sub: 'Espetos (Venda Unitária)' },
  'Porção de Batata Frita': { parent: '🟡 1. COMIDAS', sub: 'Porções' },
  'Porção de Polenta Frita': { parent: '🟡 1. COMIDAS', sub: 'Porções' },
  
  // Bebidas Alcool
  'Heineken Lata 350ml': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  'Corona 330ml LN': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  'Budweiser Lata 350ml': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  'Skol Lata 350ml': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  'Skol Lata 269ml': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  'Original 300ml LN': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Cervejas (Lata/LN)' },
  
  'Balde Corona': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Baldes (Combos)' },
  'Balde Heineken': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Baldes (Combos)' },
  'Balde Budweiser': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Baldes (Combos)' },
  'Balde Original': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Baldes (Combos)' },
  'Balde Skol': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Baldes (Combos)' },
  
  'Skol Beats': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Especiais (Ice/Beats)' },
  'Smirnoff Ice': { parent: '🟢 2. BEBIDAS (ALCOOL)', sub: 'Especiais (Ice/Beats)' },

  // Bebidas sem alcool
  'Água Mineral S/ Gás': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Águas & H2O' },
  'Água Mineral C/ Gás': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Águas & H2O' },
  'H2O': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Águas & H2O' },
  'Água Tônica': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Águas & H2O' },

  'Coca': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Refrigerantes (Lata)' },
  'Guaraná': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Refrigerantes (Lata)' },
  'Fanta': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Refrigerantes (Lata)' },
  'Refrigerante': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Refrigerantes (Lata)' },

  'Red Bull': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Energéticos' },
  'Baly': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Energéticos' },

  'Dell Valle': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Sucos & Chás' },
  'Ice Tea': { parent: '🔵 3. BEBIDAS (SEM ALCOOL)', sub: 'Sucos & Chás' },

  // Caipirinhas
  'Limão com Cachaça': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Limão' },
  'Limão com V. Barreiro': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Limão' },
  'Limão com Smirnoff': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Limão' },
  'Morango com Cachaça': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Morango' },
  'Morango com V. Barreiro': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Morango' },
  'Morango com Smirnoff': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Morango' },
  'Maracujá com Cachaça': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Maracujá' },
  'Maracujá com V. Barreiro': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Maracujá' },
  'Maracujá com Smirnoff': { parent: '🟢 4. CAIPIRINHAS', sub: 'Caipirinhas de Maracujá' },

  // Drinks Doses
  'Copão Gin Melancia': { parent: '🟠 5. DRINKS & DOSES', sub: 'Copões & Mix' },
  'Copão Jack Maçã': { parent: '🟠 5. DRINKS & DOSES', sub: 'Copões & Mix' },
  'Rainha de Copa': { parent: '🟠 5. DRINKS & DOSES', sub: 'Copões & Mix' },
  
  'Dose Whisky Red': { parent: '🟠 5. DRINKS & DOSES', sub: 'Doses Individuais' },
  'Dose Whisky Black': { parent: '🟠 5. DRINKS & DOSES', sub: 'Doses Individuais' },
  'Dose Jack': { parent: '🟠 5. DRINKS & DOSES', sub: 'Doses Individuais' },
  'Dose Vodka': { parent: '🟠 5. DRINKS & DOSES', sub: 'Doses Individuais' },

  // Combos
  'Combo Red': { parent: '🟣 6. COMBOS DE GARRAFA' },
  'Combo Black': { parent: '🟣 6. COMBOS DE GARRAFA' },
  'Combo Jack': { parent: '🟣 6. COMBOS DE GARRAFA' },
  'Combo Gin': { parent: '🟣 6. COMBOS DE GARRAFA' },

  // Garrafas
  'Jack Daniel': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Whiskys (Garrafa Fechada)' },
  'Black Label': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Whiskys (Garrafa Fechada)' },
  'Red Label': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Whiskys (Garrafa Fechada)' },
  'Ballantine': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Whiskys (Garrafa Fechada)' },
  
  'Beefeater': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Gins (Garrafa Fechada)' },
  'Bombay': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Gins (Garrafa Fechada)' },
  'Gin Eternity': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Gins (Garrafa Fechada)' },
  'Gordons': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Gins (Garrafa Fechada)' },

  'Licor 43': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Amarula': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Aperol': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Campari': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Jurupinga': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Velho Barreiro': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Cachaça 51': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },
  'Pitu': { parent: '🔴 7. GARRAFAS AVULSAS', sub: 'Licores & Aperitivos (Garrafa Fechada)' },

  // Lazer
  'Ficha Bilhar': { parent: '⚫ 8. LAZER / NARGUILÉ' },
  'Narguile': { parent: '⚫ 8. LAZER / NARGUILÉ' },
};

async function run() {
  console.log('Buscando categorias e produtos...');
  const existingCategories = await api.getCategories();
  const existingProducts = await api.getProducts();

  const catMap = new Map(); // name -> id

  // 1. Create Parents
  for (const parent of newStructure) {
    let pCat = existingCategories.find(c => c.name === parent.p);
    if (!pCat) {
      console.log(`Criando Pai: ${parent.p}`);
      const { data, error } = await supabase.from('categories').insert({ name: parent.p, show_on_waiter: true }).select('id, name').single();
      pCat = data;
    }
    catMap.set(parent.p, pCat.id);

    // 2. Create Subs
    for (const sub of parent.subs) {
      let sCat = existingCategories.find(c => c.name === sub && c.parent_id === pCat.id);
      if (!sCat) {
        console.log(`Criando Sub: ${sub}`);
        const { data, error } = await supabase.from('categories').insert({ name: sub, parent_id: pCat.id, show_on_waiter: true }).select('id, name').single();
        sCat = data;
      }
      catMap.set(`${parent.p}::${sub}`, sCat.id);
    }
  }

  // 3. Move Products
  // Se o nome do produto bater com mappings, mudamos a category_id.
  for (const prod of existingProducts) {
    // Busca matches
    let targetParent = null;
    let targetSub = null;

    for (const [key, mapping] of Object.entries(exactMappings)) {
      if (prod.name.toLowerCase().includes(key.toLowerCase())) {
        targetParent = mapping.parent;
        targetSub = mapping.sub;
        break;
      }
    }

    if (!targetParent && !targetSub) {
      // Tentar categorizar como Lanche
      if (prod.category_name?.toLowerCase().includes('lanche')) {
         targetParent = '🟡 1. COMIDAS';
         targetSub = 'Lanches';
      } else {
         console.log(`Produto nao mapeado: ${prod.name}`);
         continue; // Nao alterar se nao achar
      }
    }

    let destId = null;
    if (targetSub) {
      destId = catMap.get(`${targetParent}::${targetSub}`);
    } else if (targetParent) {
      destId = catMap.get(targetParent);
    }

    if (destId && prod.category_id !== destId) {
      console.log(`Movendo ${prod.name} para ${targetParent} -> ${targetSub}`);
      await supabase.from('products').update({ category_id: destId }).eq('id', prod.id);
    }
  }

  // 4. Cleanup old empty categories (Optional)
  // we do not aggressively delete old ones unless we are sure they are empty
  const prodsNow = await api.getProducts();
  const usedCatIds = new Set(prodsNow.map(p => p.category_id));
  
  for (const cat of existingCategories) {
    if (!catMap.has(cat.name) && Array.from(catMap.entries()).every(([k, v]) => v !== cat.id)) {
      // old category. Is it used?
      if (!usedCatIds.has(cat.id)) {
        console.log(`Limpando categoria antiga nao utilizada: ${cat.name}`);
        await api.deleteCategory(cat.id).catch(e => console.log('Falha ao deletar', cat.name));
      }
    }
  }

  console.log('Concluido!');
}

run();

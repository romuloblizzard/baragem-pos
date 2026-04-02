import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' }); 

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const productsToInsert = [
  { name: 'Espetinho Bovino', price: 10, targetCat: 'Espetos (Venda Unitária)' },
  { name: 'Espetinho de Frango', price: 10, targetCat: 'Espetos (Venda Unitária)' },
  { name: 'Espetinho Meio da Asa', price: 10, targetCat: 'Espetos (Venda Unitária)' },
  { name: 'Porção de Batata Frita (500g)', price: 45, targetCat: 'Porções' },
  { name: 'Porção de Polenta Frita (500g)', price: 35, targetCat: 'Porções' },

  { name: 'Heineken Lata 350ml', price: 12, targetCat: 'Cervejas (Lata/LN)', category_name: 'Lata' },
  { name: 'Corona 330ml LN', price: 12, targetCat: 'Cervejas (Lata/LN)', category_name: 'Garrafa' },
  { name: 'Budweiser Lata 350ml', price: 8, targetCat: 'Cervejas (Lata/LN)', category_name: 'Lata' },
  { name: 'Skol Lata 350ml', price: 7, targetCat: 'Cervejas (Lata/LN)', category_name: 'Lata' },
  { name: 'Skol Lata 269ml', price: 8, targetCat: 'Cervejas (Lata/LN)', category_name: 'Lata' },
  { name: 'Original 300ml LN', price: 7, targetCat: 'Cervejas (Lata/LN)', category_name: 'Garrafa' },

  { name: 'Balde Corona (6un)', price: 70, targetCat: 'Baldes (Combos)', type: 'composition' },
  { name: 'Balde Heineken (6un)', price: 60, targetCat: 'Baldes (Combos)', type: 'composition' },
  { name: 'Balde Budweiser (5un)', price: 60, targetCat: 'Baldes (Combos)', type: 'composition' },
  { name: 'Balde Original (5un)', price: 50, targetCat: 'Baldes (Combos)', type: 'composition' },
  { name: 'Balde Skol (5un)', price: 50, targetCat: 'Baldes (Combos)', type: 'composition' },

  { name: 'Skol Beats (Azul/Vermelha)', price: 12, targetCat: 'Especiais (Ice/Beats)' },
  { name: 'Smirnoff Ice (Original/Maçã/Tropical)', price: 14, targetCat: 'Especiais (Ice/Beats)' },

  { name: 'Água Mineral S/ Gás', price: 5, targetCat: 'Águas & H2O' },
  { name: 'Água Mineral C/ Gás', price: 6, targetCat: 'Águas & H2O' },
  { name: 'H2O (Limão/Limoneto)', price: 9, targetCat: 'Águas & H2O' },
  { name: 'Água Tônica 350ml', price: 8, targetCat: 'Águas & H2O' },

  { name: 'Coca-Cola / Zero', price: 7, targetCat: 'Refrigerantes (Lata)' },
  { name: 'Guaraná / Fanta / Outros', price: 7, targetCat: 'Refrigerantes (Lata)' },

  { name: 'Red Bull (Todos os Sabores)', price: 15, targetCat: 'Energéticos' },
  { name: 'Baly 2L (Melancia/Morango)', price: 5, targetCat: 'Energéticos' },

  { name: 'Dell Valle (Sabores)', price: 7, targetCat: 'Sucos & Chás' },
  { name: 'Ice Tea Pêssego', price: 7, targetCat: 'Sucos & Chás' },

  { name: 'Limão com Cachaça 51', price: 30, targetCat: 'Caipirinhas de Limão', type: 'variable' },
  { name: 'Limão com V. Barreiro', price: 32, targetCat: 'Caipirinhas de Limão', type: 'variable' },
  { name: 'Limão com Smirnoff', price: 35, targetCat: 'Caipirinhas de Limão', type: 'variable' },
  { name: 'Morango com Cachaça 51', price: 30, targetCat: 'Caipirinhas de Morango', type: 'variable' },
  { name: 'Morango com V. Barreiro', price: 32, targetCat: 'Caipirinhas de Morango', type: 'variable' },
  { name: 'Morango com Smirnoff', price: 35, targetCat: 'Caipirinhas de Morango', type: 'variable' },
  { name: 'Maracujá com Cachaça 51', price: 30, targetCat: 'Caipirinhas de Maracujá', type: 'variable' },
  { name: 'Maracujá com V. Barreiro', price: 32, targetCat: 'Caipirinhas de Maracujá', type: 'variable' },
  { name: 'Maracujá com Smirnoff', price: 35, targetCat: 'Caipirinhas de Maracujá', type: 'variable' },

  { name: 'Copão Gin Melancia', price: 12, targetCat: 'Copões & Mix' },
  { name: 'Copão Jack Maçã', price: 35, targetCat: 'Copões & Mix' },
  { name: 'Rainha de Copa', price: 30, targetCat: 'Copões & Mix' },

  { name: 'Dose Whisky Red Label', price: 22, targetCat: 'Doses Individuais' },
  { name: 'Dose Whisky Black Label', price: 20, targetCat: 'Doses Individuais' },
  { name: 'Dose Jack Tradicional', price: 28, targetCat: 'Doses Individuais' },
  { name: 'Dose Vodka Smirnoff', price: 12, targetCat: 'Doses Individuais' },

  { name: 'Combo Red Label + 4 RB + Gelo', price: 350, targetCat: '🟣 6. COMBOS DE GARRAFA' },
  { name: 'Combo Black Label + 4 RB + Gelo', price: 420, targetCat: '🟣 6. COMBOS DE GARRAFA' },
  { name: 'Combo Jack Daniels + 4 RB + Gelo', price: 450, targetCat: '🟣 6. COMBOS DE GARRAFA' },
  { name: 'Combo Gin Eternity + 4 RB + Gelo', price: 100, targetCat: '🟣 6. COMBOS DE GARRAFA' },

  { name: 'Whisky Jack Daniel\'s (Trad/Mel/Maçã)', price: 250, targetCat: 'Whiskys (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Whisky J. Walker Black Label', price: 180, targetCat: 'Whiskys (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Whisky J. Walker Red Label', price: 120, targetCat: 'Whiskys (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Whisky Ballantines', price: 90, targetCat: 'Whiskys (Garrafa Fechada)', category_name: 'Garrafa' },

  { name: 'Gin Beefeater 750ml', price: 98, targetCat: 'Gins (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Gin Bombay 750ml', price: 160, targetCat: 'Gins (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Gin Eternity (Sabores)', price: 19.90, targetCat: 'Gins (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Gin Gordons', price: 80, targetCat: 'Gins (Garrafa Fechada)', category_name: 'Garrafa' },

  { name: 'Licor 43', price: 180, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Amarula', price: 120, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Aperol', price: 180, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Campari', price: 180, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Jurupinga', price: 35, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Velho Barreiro', price: 34.90, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },
  { name: 'Cachaça 51', price: 40, targetCat: 'Licores & Aperitivos (Garrafa Fechada)', category_name: 'Garrafa' },

  { name: 'Ficha Bilhar', price: 3, targetCat: '⚫ 8. LAZER / NARGUILÉ', category_name: 'Lazer' },
  { name: 'Narguile (Primeiro)', price: 45, targetCat: '⚫ 8. LAZER / NARGUILÉ', category_name: 'Lazer' },
  { name: 'Narguile (Reposição)', price: 20, targetCat: '⚫ 8. LAZER / NARGUILÉ', category_name: 'Lazer' },
];


async function run() {
  console.log('Autenticando...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '123456@baragem.local',
    password: '123456'
  });

  if (authError) {
    console.error('Falha na autenticação:', authError);
    return;
  }
  console.log('Autenticado com sucesso!');

  console.log('Buscando categorias atuais...');
  const { data: categories } = await supabase.from('categories').select('*');

  console.log('Inserindo/Atualizando produtos...');
  for (const item of productsToInsert) {
    // Achar categoria pelo nome
    // Para targetCat: "Espetos (Venda Unitária)"
    // pode ser uma categoria PAI ou FILHA.
    const cat = categories?.find(c => c.name === item.targetCat);
    const catId = cat ? cat.id : null;

    if (!catId) {
      console.log(`Categoria não encontrada para: ${item.name} (${item.targetCat})`);
    }

    console.log(`Inserindo: ${item.name} em ${item.targetCat}...`);
    const { error } = await supabase.from('products').insert({
      name: item.name,
      price: item.price,
      category_id: catId,
      type: item.type || 'simple',
      active: true,
      stock: 999, // default
      cost_price: 0
    });

    if (error) {
      console.error(`Falha ao inserir ${item.name}:`, error.message);
    }
  }

  console.log('Concluido!');
}

run();

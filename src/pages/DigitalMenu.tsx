import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  category_name: string | null;
  active: boolean;
  description?: string;
  image_url?: string;
}

export default function DigitalMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const categoryNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const productsData = await api.getProducts();
        
        // Filter out ingredients and unwanted categories
        const visibleProducts = productsData.filter((p: any) => {
          const cat = (p.category_name || '').toLowerCase();
          return p.type !== 'ingredient' && 
                 !cat.includes('insumo') && 
                 !cat.includes('matéria') &&
                 p.active !== false;
        });
        
        setProducts(visibleProducts);
        
        // Find categories
        const cats = Array.from(new Set(visibleProducts.map((p: any) => p.category_name || 'Diversos')));
        if (cats.length > 0) setActiveCategory(cats[0] as string);
        
      } catch (err) {
        console.error('Erro ao carregar cardápio', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category_name || 'Diversos'))).sort();
  
  const groupedProducts: Record<string, Product[]> = {};
  categories.forEach(cat => {
    groupedProducts[cat] = products.filter(p => (p.category_name || 'Diversos') === cat);
  });

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      // Offset by the height of the sticky header (approx 80px)
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c120a] flex items-center justify-center">
        <div className="text-[#ebdccc] text-xl font-bold animate-pulse">Carregando Cardápio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c120a] text-[#ebdccc] font-sans pb-20">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#140c06]/95 backdrop-blur-md border-b border-[#36261a] shadow-xl">
        <div className="pt-6 pb-4 px-4 text-center">
          <h1 className="text-3xl font-black tracking-widest text-[#dfccb3] uppercase">Cardápio</h1>
        </div>
        
        {/* Category Navigation - Horizontal Scroll */}
        <div 
          ref={categoryNavRef}
          className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-3 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold tracking-wider transition-all snap-start
                ${activeCategory === cat 
                  ? 'bg-[#dfccb3] text-[#1c120a] shadow-[0_0_15px_rgba(223,204,179,0.4)]' 
                  : 'bg-[#2c1f17] text-[#b59b82] border border-[#36261a] hover:bg-[#36261a]'
                }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Background Texture (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')]" />

      {/* Main Content */}
      <main className="px-4 pt-6 max-w-3xl mx-auto relative z-10">
        {categories.map((cat) => (
          <section key={cat} id={`category-${cat}`} className="mb-12 scroll-mt-24">
            
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent to-[#4a3625] flex-1" />
              <h2 className="text-2xl font-black tracking-widest text-[#dfccb3] uppercase px-4 py-2 bg-[#2c1f17] border border-[#4a3625] rounded shadow-lg transform -skew-x-6">
                <span className="transform skew-x-6 block">{cat}</span>
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent to-[#4a3625] flex-1" />
            </div>

            {/* Product List */}
            <div className="grid gap-4">
              {groupedProducts[cat].map((product) => (
                <div 
                  key={product.id} 
                  className="bg-[#24170f] border border-[#36261a] rounded-xl p-4 flex justify-between items-center shadow-lg"
                >
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg font-bold text-[#fdf5e6]">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-[#b59b82] mt-1 leading-snug">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="bg-[#140c06] px-4 py-2 rounded-lg border border-[#36261a] min-w-[100px] text-center">
                    <span className="text-xs text-[#b59b82] block mb-0.5">R$</span>
                    <span className="text-xl font-black text-[#dfccb3]">
                      {product.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
          </section>
        ))}
      </main>
      
      {/* Footer Branding */}
      <footer className="text-center py-8 opacity-50 relative z-10">
        <p className="text-xs text-[#b59b82] tracking-widest uppercase">Baragem • Cardápio Digital</p>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}

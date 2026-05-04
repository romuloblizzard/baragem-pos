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
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const categoryNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, settingsData] = await Promise.all([
          api.getProducts(),
          api.getSettings()
        ]);
        
        // Filter out ingredients and unwanted categories
        const visibleProducts = productsData.filter((p: any) => {
          const cat = (p.category_name || '').toLowerCase();
          return p.type !== 'ingredient' && 
                 !cat.includes('insumo') && 
                 !cat.includes('matéria') &&
                 p.active !== false;
        });
        
        setProducts(visibleProducts);
        
        if (settingsData.digital_menu_config) {
          setConfig(JSON.parse(settingsData.digital_menu_config));
        }
        
        // Find categories
        const cats = Array.from(new Set(visibleProducts.map((p: any) => p.category_name || 'Diversos'))).sort();
        if (cats.length > 0) setActiveCategory(cats[0] as string);
        
      } catch (err) {
        console.error('Erro ao carregar cardápio', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ScrollSpy Implementation
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Get the one with the highest intersection ratio
          const mostVisible = visibleEntries.reduce((prev, current) => 
            (prev.intersectionRatio > current.intersectionRatio) ? prev : current
          );
          
          const catName = mostVisible.target.id.replace('category-', '');
          setActiveCategory(catName);

          // Scroll the top nav button into view
          const btn = document.getElementById(`nav-btn-${catName}`);
          if (btn && categoryNavRef.current) {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      },
      {
        rootMargin: '-100px 0px -60% 0px', // Triggers when element is near the top
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    const sections = document.querySelectorAll('section[id^="category-"]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [loading, products]);

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

  const firstPage = config?.pages?.[0] || {};
  const watermark = firstPage.watermark || '';
  const fontFamily = firstPage.fontFamily || 'Inter, sans-serif';
  const watermarkOpacity = (firstPage.watermarkOpacity ?? 15) / 100;
  const watermarkSaturation = (firstPage.watermarkSaturation ?? 100) / 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')]" />
        <div className="text-[#36261a] text-xl font-bold animate-pulse z-10 font-serif">Aguarde...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-parchment text-[#1a110a] pb-20 relative overflow-hidden"
      style={{ fontFamily }}
    >
      {/* Dynamic Watermark Background from Config */}
      {watermark && (
        <div 
          className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 p-8"
          style={{ opacity: watermarkOpacity }}
        >
          <img 
            src={watermark} 
            alt="watermark" 
            className="w-full h-full object-cover sm:object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" 
            style={{ filter: `saturate(${watermarkSaturation * 100}%)` }}
          />
        </div>
      )}

      {/* Background Texture (Subtle) & Grunge Edges */}
      <div className="fixed inset-0 opacity-40 pointer-events-none mix-blend-multiply z-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')]" />
      <div className="fixed inset-0 z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#ebdccc]/95 backdrop-blur-md border-b-4 border-[#36261a] border-double shadow-2xl">
        <div className="pt-6 pb-4 px-4 text-center">
          <h1 className="text-3xl font-black tracking-widest text-[#2c1f17] uppercase drop-shadow-md">Cardápio</h1>
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
              id={`nav-btn-${cat}`}
              onClick={() => scrollToCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold tracking-widest uppercase transition-all snap-start
                ${activeCategory === cat 
                  ? 'bg-[#36261a] text-[#ebdccc] shadow-lg transform scale-105' 
                  : 'bg-transparent text-[#4a3625] border-2 border-[#4a3625] hover:bg-[#4a3625]/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-8 max-w-3xl mx-auto relative z-10">
        {categories.map((cat) => (
          <section key={cat} id={`category-${cat}`} className="mb-14 scroll-mt-32">
            
            {/* Section Header Vintage */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#4a3625] to-[#4a3625] flex-1" />
              <h2 className="text-2xl font-black tracking-widest text-[#2c1f17] uppercase px-4 py-2 border-y-2 border-[#4a3625]">
                {cat}
              </h2>
              <div className="h-[2px] bg-gradient-to-l from-transparent via-[#4a3625] to-[#4a3625] flex-1" />
            </div>

            {/* Product List */}
            <div className="grid gap-6">
              {groupedProducts[cat].map((product) => (
                <div 
                  key={product.id} 
                  className="bg-transparent border-b border-dashed border-[#4a3625]/40 pb-4 flex justify-between items-start"
                >
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg font-bold text-[#1a110a] uppercase tracking-wide">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-[#4a3625] mt-1 italic font-serif leading-snug">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className="text-xs text-[#4a3625] font-bold">R$</span>
                    <span className="text-xl font-black text-[#1a110a] tracking-tighter">
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
      <footer className="text-center py-12 relative z-10">
        <p className="text-xs text-[#4a3625] tracking-widest uppercase font-bold opacity-60 border-t border-[#4a3625]/20 pt-8 mx-12">
          Baragem • Cardápio Digital
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}

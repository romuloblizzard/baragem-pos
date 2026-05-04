import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const categoryNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, settingsData] = await Promise.all([
          api.getProducts(),
          api.getSettings()
        ]);
        
        setProducts(productsData);
        
        if (settingsData.digital_menu_config) {
          const parsedConfig = JSON.parse(settingsData.digital_menu_config);
          setConfig(parsedConfig);
        }
        
      } catch (err) {
        console.error('Erro ao carregar cardápio', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalPages = config?.pages?.length || 1;
  const currentPage = config?.pages?.[currentPageIndex] || { title: '', watermark: '', groups: [] };
  const currentGroups = currentPage.groups || [];

  // Reset active category when page changes
  useEffect(() => {
    if (currentGroups.length > 0) {
      setActiveCategory(currentGroups[0].id);
    }
  }, [currentPageIndex]);

  // ScrollSpy Implementation
  useEffect(() => {
    if (loading || currentGroups.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const mostVisible = visibleEntries.reduce((prev, current) => 
            (prev.intersectionRatio > current.intersectionRatio) ? prev : current
          );
          
          const groupId = mostVisible.target.id.replace('group-', '');
          setActiveCategory(groupId);

          const btn = document.getElementById(`nav-btn-${groupId}`);
          if (btn && categoryNavRef.current) {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    const sections = document.querySelectorAll('section[id^="group-"]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [loading, currentGroups, currentPageIndex]);

  const scrollToGroup = (groupId: string) => {
    setActiveCategory(groupId);
    const element = document.getElementById(`group-${groupId}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const watermark = currentPage.watermark || '';
  const fontFamily = currentPage.fontFamily || 'Inter, sans-serif';
  const watermarkOpacity = (currentPage.watermarkOpacity ?? 15) / 100;
  const watermarkSaturation = (currentPage.watermarkSaturation ?? 100) / 100;

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
      className="min-h-screen bg-parchment text-[#1a110a] pb-20 relative"
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
      <header className="sticky top-0 z-40 bg-[#ebdccc]/95 backdrop-blur-md border-b-4 border-[#36261a] border-double shadow-2xl">
        <div className="pt-6 pb-2 px-4 text-center">
          <h1 className="text-3xl font-black tracking-widest text-[#2c1f17] uppercase drop-shadow-md">
            {currentPage.title || 'Cardápio'}
          </h1>
        </div>
        
        {/* Category Navigation - Horizontal Scroll */}
        {currentGroups.length > 0 && (
          <div 
            ref={categoryNavRef}
            className="flex overflow-x-auto hide-scrollbar px-4 pb-4 pt-2 gap-3 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {currentGroups.map((group: any) => (
              <button
                key={group.id}
                id={`nav-btn-${group.id}`}
                onClick={() => scrollToGroup(group.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold tracking-widest uppercase transition-all snap-start
                  ${activeCategory === group.id 
                    ? 'bg-[#36261a] text-[#ebdccc] shadow-lg transform scale-105' 
                    : 'bg-transparent text-[#4a3625] border-2 border-[#4a3625] hover:bg-[#4a3625]/10'
                  }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 pt-8 max-w-3xl mx-auto relative z-10 min-h-[60vh]">
        {currentGroups.map((group: any) => (
          <section key={group.id} id={`group-${group.id}`} className="mb-14 scroll-mt-32">
            
            {/* Section Header Vintage */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#4a3625] to-[#4a3625] flex-1" />
              <h2 className="text-2xl font-black tracking-widest text-[#2c1f17] uppercase px-4 py-2 border-y-2 border-[#4a3625]">
                {group.name}
              </h2>
              <div className="h-[2px] bg-gradient-to-l from-transparent via-[#4a3625] to-[#4a3625] flex-1" />
            </div>

            {/* Product List */}
            <div className="grid gap-6">
              {group.products?.map((p: any) => {
                const liveProduct = products.find(prod => prod.id === p.id);
                if (!liveProduct) return null;

                return (
                  <div 
                    key={liveProduct.id} 
                    className="bg-transparent border-b border-dashed border-[#4a3625]/40 pb-4 flex justify-between items-start"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className={`text-lg font-bold text-[#1a110a] uppercase tracking-wide ${p.highlighted ? 'text-amber-700' : ''}`}>
                        {liveProduct.name}
                      </h3>
                      {liveProduct.description && (
                        <p className="text-sm text-[#4a3625] mt-1 italic font-serif leading-snug">{liveProduct.description}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end min-w-[80px]">
                      <span className="text-xs text-[#4a3625] font-bold">R$</span>
                      <span className="text-xl font-black text-[#1a110a] tracking-tighter">
                        {liveProduct.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </section>
        ))}
      </main>
      
      {/* Footer Branding */}
      <footer className="text-center py-12 relative z-10 mb-16">
        <p className="text-xs text-[#4a3625] tracking-widest uppercase font-bold opacity-60 border-t border-[#4a3625]/20 pt-8 mx-12">
          Baragem • Cardápio Digital
        </p>
      </footer>

      {/* FLOATING CONTROLS (Folhas) */}
      {totalPages > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 bg-[#2c1f17]/95 border border-[#4a3625] px-6 py-2 rounded-full shadow-2xl backdrop-blur-md">
          <button 
            onClick={() => {
              setCurrentPageIndex(v => Math.max(0, v - 1));
              window.scrollTo(0, 0);
            }} 
            className="text-[#b59b82] hover:text-white transition-all disabled:opacity-20" 
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft size={36} />
          </button>
          
          <span className="text-[#e2cbb2] text-xl font-bold px-4 tracking-widest" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            FOLHA {currentPageIndex + 1 < 10 ? `0${currentPageIndex + 1}` : currentPageIndex + 1} / {totalPages}
          </span>
          
          <button 
            onClick={() => {
              setCurrentPageIndex(v => Math.min(totalPages - 1, v + 1));
              window.scrollTo(0, 0);
            }} 
            className="text-[#b59b82] hover:text-white transition-all disabled:opacity-20" 
            disabled={currentPageIndex === totalPages - 1}
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}

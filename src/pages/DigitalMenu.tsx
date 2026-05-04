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
  const [flatGroups, setFlatGroups] = useState<any[]>([]);
  
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
          
          const groups: any[] = [];
          parsedConfig.pages?.forEach((page: any) => {
            page.groups?.forEach((group: any) => {
              groups.push(group);
            });
          });
          
          setFlatGroups(groups);
          if (groups.length > 0) setActiveCategory(groups[0].id);
        }
        
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
    if (loading || flatGroups.length === 0) return;

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
  }, [loading, flatGroups]);

  const scrollToGroup = (groupId: string) => {
    setActiveCategory(groupId);
    const element = document.getElementById(`group-${groupId}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-xl font-bold tracking-widest text-[#4a3625] animate-pulse">Carregando cardápio...</div>
      </div>
    );
  }

  const pages = config?.pages || [];
  // Use the global background texture but we'll apply the specific watermark per page.
  // We can use the first page's font family globally to keep the header consistent.
  const globalFont = pages[0]?.fontFamily || 'Inter, sans-serif';

  return (
    <div 
      className="min-h-screen bg-parchment text-[#1a110a] relative pb-10"
      style={{ fontFamily: globalFont }}
    >
      {/* Background Texture (Global) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.25] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')]" />
      <div className="fixed inset-0 z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#ebdccc]/95 backdrop-blur-md border-b-4 border-[#36261a] border-double shadow-2xl">
        <div className="pt-6 pb-2 px-4 text-center">
          <h1 className="text-3xl font-black tracking-widest text-[#2c1f17] uppercase drop-shadow-md">
            Cardápio
          </h1>
        </div>
        
        {/* Category Navigation - Horizontal Scroll */}
        {flatGroups.length > 0 && (
          <div 
            ref={categoryNavRef}
            className="flex overflow-x-auto hide-scrollbar px-4 pb-4 pt-2 gap-3 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {flatGroups.map((group: any) => (
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

      {/* Main Content (Stacked Pages) */}
      <main className="max-w-3xl mx-auto relative z-10 min-h-[60vh] flex flex-col">
        {pages.map((page: any, pageIndex: number) => {
          const watermark = page.watermark || '';
          const watermarkOpacity = (page.watermarkOpacity ?? 15) / 100;
          const watermarkSaturation = (page.watermarkSaturation ?? 100) / 100;
          
          return (
            <div key={page.id || pageIndex} className="relative w-full pt-8 pb-16 px-4 border-b-8 border-dashed border-[#4a3625]/20 last:border-0">
              
              {/* Local Watermark for this specific Page */}
              {watermark && (
                <div 
                  className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-contain"
                  style={{ 
                    backgroundImage: `url(${watermark})`,
                    opacity: watermarkOpacity,
                    filter: `saturate(${watermarkSaturation})`,
                    backgroundPosition: 'center center'
                  }}
                />
              )}

              {/* Page Title (Folha Title) */}
              {page.title && (
                <div className="relative z-10 text-center mb-12">
                   <h2 className="inline-block text-[2.5rem] leading-none font-black tracking-widest text-[#1c120a] border-y-4 border-[#332215] py-2 px-8 uppercase" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                     {page.title}
                   </h2>
                </div>
              )}

              {/* Groups within this Page */}
              <div className="relative z-10">
                {page.groups?.map((group: any) => (
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
              </div>
            </div>
          );
        })}
      </main>
      
      {/* Footer Branding */}
      <footer className="text-center py-12 relative z-10 mb-16">
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

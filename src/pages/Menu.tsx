import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Printer, ChevronLeft, ChevronRight, Cog, Wrench, AlertCircle, Settings,
  Zap, Wind, Flame, Beer, GlassWater, Anchor, FlaskConical, MapPin, Leaf, Coffee
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  category_name: string | null;
  active: boolean;
}

interface MenuProduct {
  id: number;
  highlighted: boolean;
}

interface MenuGroup {
  id: string;
  name: string;
  iconName: string;
  products: MenuProduct[];
}

interface MenuPage {
  id: string;
  title: string;
  watermark: string;
  watermarkOpacity?: number;
  watermarkSaturation?: number;
  groups: MenuGroup[];
}

interface MenuConfig {
  pages: MenuPage[];
}

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<MenuConfig>({ pages: [] });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, settingsData] = await Promise.all([
          api.getProducts(),
          api.getSettings()
        ]);
        
        // Strictly filter only visible products (No ingredients, no insumos)
        const visibleProducts = productsData.filter((p: any) => {
          const cat = (p.category_name || '').toLowerCase();
          return p.type !== 'ingredient' && !cat.includes('insumo') && !cat.includes('matéria');
        });
        
        setProducts(visibleProducts);
        if (settingsData.digital_menu_config) {
          setConfig(JSON.parse(settingsData.digital_menu_config));
        } else {
          setConfig({ pages: [] });
        }
      } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalPages = config.pages.length || 1;
  const currentPage = config.pages[currentPageIndex] || { title: "NENHUMA PÁGINA CONFIGURADA", watermark: "", groups: [] };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2c241e] flex items-center justify-center">
        <div className="animate-spin text-amber-600"><Cog size={64} /></div>
      </div>
    );
  }

  const getSubIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return <Wrench size={28} className="text-[#ebdccc] mb-1" />;
      case 'Beer': return <Beer size={28} className="text-[#ebdccc] mb-1" />;
      case 'GlassWater': return <GlassWater size={28} className="text-[#ebdccc] mb-1" />;
      case 'FlaskConical': return <FlaskConical size={28} className="text-[#ebdccc] mb-1" />;
      case 'Zap': return <Zap size={28} className="text-[#ebdccc] mb-1" />;
      case 'Wind': return <Wind size={28} className="text-[#ebdccc] mb-1" />;
      case 'Flame': return <Flame size={28} className="text-[#ebdccc] mb-1" />;
      case 'Leaf': return <Leaf size={28} className="text-[#ebdccc] mb-1" />;
      case 'Coffee': return <Coffee size={28} className="text-[#ebdccc] mb-1" />;
      default: return <Settings size={28} className="text-[#ebdccc] mb-1" />;
    }
  };

  return (
    <div 
        className="min-h-screen flex flex-col items-center py-6 px-4 print:p-0 select-none bg-rust"
    >
      
      {/* FLOATING CONTROLS */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 print:hidden bg-[#2c1f17]/95 border border-[#4a3625] px-6 py-2 rounded-full shadow-2xl backdrop-blur-md">
        <button onClick={() => setCurrentPageIndex(v => Math.max(0, v - 1))} className="text-[#b59b82] hover:text-white transition-all disabled:opacity-20" disabled={currentPageIndex === 0}><ChevronLeft size={36} /></button>
        <span className="text-[#e2cbb2] text-xl font-bold px-4 tracking-widest textShadow">FOLHA {currentPageIndex + 1 < 10 ? `0${currentPageIndex + 1}` : currentPageIndex + 1} / {totalPages}</span>
        <button onClick={() => setCurrentPageIndex(v => Math.min(totalPages - 1, v + 1))} className="text-[#b59b82] hover:text-white transition-all disabled:opacity-20" disabled={currentPageIndex === totalPages - 1}><ChevronRight size={36} /></button>
        <div className="w-px h-8 bg-[#4a3625] mx-2" />
        <button onClick={handlePrint} className="bg-[#a88a6d] hover:bg-[#c4a482] text-[#2c1f17] px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all">
          <Printer size={20} /> IMPRIMIR A4
        </button>
      </div>

      {/* PAPER CONTAINER (A4 Proportion) */}
      <div 
        id="printable-menu"
        className={`relative w-[210mm] h-[297mm] bg-parchment print:w-[210mm] print:h-[297mm] print:m-0 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] border-[16px] border-[#36261a] border-double box-border ${config.forceBold ? 'force-bold' : ''}`}
        style={{ 
          fontFamily: currentPage.fontFamily || 'Inter, sans-serif',
          fontSize: `${config.globalFontSize || 100}%`,
          "--watermark-opacity": (config.watermarkOpacity || 15) / 100,
          "--watermark-saturate": (config.watermarkSaturation || 100) / 100
        } as React.CSSProperties}
      >
        
        {/* MARCA D'ÁGUA DINÂMICA (WATERMARK) */}
        {currentPage.watermark && (
          <div 
             className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 p-16"
             style={{ opacity: (currentPage.watermarkOpacity ?? 35) / 100 }}
          >
             <img 
                src={currentPage.watermark} 
                alt="watermark" 
                className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" 
                style={{ filter: `saturate(${currentPage.watermarkSaturation ?? 100}%)` }}
             />
          </div>
        )}

        {/* BRUSHED DIRT & GRUNGE EDGES */}
        <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')]" />

        {/* CORNER RUSTY METALS */}
        <div className="absolute top-0 left-0 w-32 h-32 z-20 pointer-events-none">
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)]" preserveAspectRatio="none">
             <polygon points="0,0 100,0 0,100" fill="url(#rust-grad)" stroke="#1a110a" strokeWidth="2" />
             <circle cx="15" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="15" cy="80" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="80" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
           </svg>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 z-20 pointer-events-none scale-x-[-1]">
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)]" preserveAspectRatio="none">
             <polygon points="0,0 100,0 0,100" fill="url(#rust-grad)" stroke="#1a110a" strokeWidth="2" />
             <circle cx="15" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="15" cy="80" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="80" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
           </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 z-20 pointer-events-none scale-y-[-1]">
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)]" preserveAspectRatio="none">
             <polygon points="0,0 100,0 0,100" fill="url(#rust-grad)" stroke="#1a110a" strokeWidth="2" />
             <circle cx="15" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="15" cy="80" r="5" fill="#444" stroke="#111" strokeWidth="2" />
             <circle cx="80" cy="15" r="5" fill="#444" stroke="#111" strokeWidth="2" />
           </svg>
        </div>
        
        {/* SVG Definition for rust gradient */}
        <svg className="hidden">
           <defs>
              <linearGradient id="rust-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                 {/* Cores de ferrugem mais velhas e fortes */}
                 <stop offset="0%" stopColor="#4a2818" />
                 <stop offset="50%" stopColor="#7a4225" />
                 <stop offset="100%" stopColor="#30180d" />
              </linearGradient>
           </defs>
        </svg>

        <div className="px-16 py-16 flex-1 z-10 flex flex-col h-full">
          
          {/* RUSTY LICENSE PLATE HEADER */}
          <div className="flex justify-center mb-10 relative">
             <div className="relative bg-gradient-to-b from-[#8f7961] to-[#594430] border-4 border-[#332215] rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] px-16 py-3 min-w-[350px] text-center before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/rusty-metal.png')] before:opacity-30 before:pointer-events-none">
                
                {/* Plate Dirty Cutouts (Screws holes) */}
                <div className="absolute top-2 left-6 w-5 h-2 rounded-full bg-[#170e08] shadow-inner opacity-90 border-[1px] border-white/10" />
                <div className="absolute top-2 right-6 w-5 h-2 rounded-full bg-[#170e08] shadow-inner opacity-90 border-[1px] border-white/10" />
                <div className="absolute bottom-2 left-6 w-5 h-2 rounded-full bg-[#170e08] shadow-inner opacity-90 border-[1px] border-white/10" />
                <div className="absolute bottom-2 right-6 w-5 h-2 rounded-full bg-[#170e08] shadow-inner opacity-90 border-[1px] border-white/10" />

                <h1 className="text-[3em] font-black text-[#1c120a] tracking-wider mb-0" style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.2)' }}>
                  {currentPage.title}
                </h1>
             </div>
          </div>

          {/* LIST WITH BRUSHED EFFECT */}
          <div className="flex-1 space-y-8 pr-4">
             {currentPage.groups.length === 0 ? (
               <div className="flex flex-col items-center justify-center opacity-30 mt-20">
                 <AlertCircle size={100} className="mb-4" />
                 <p className="text-[2.25em] font-black">PÁGINA VAZIA</p>
               </div>
             ) : (
               currentPage.groups.map((group) => (
                 <div key={group.id} className="break-inside-avoid">
                    
                    {/* SUBCATEGORY - BRUSHED WOOD / CHALKBOARD EFFECT */}
                    <div className="flex items-center gap-3 mb-4">
                       <div className="bg-[#24170f] text-[#ebdccc] px-5 py-1 rounded shadow-md transform -skew-x-12 border-l-4 border-[#8c5735] flex items-center gap-3">
                          <div className="transform skew-x-12">{getSubIcon(group.iconName)}</div>
                          <h2 className="text-[1.5em] font-black tracking-widest transform skew-x-12">
                            {group.name.toUpperCase()}
                          </h2>
                       </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="pl-6 pr-6 space-y-2">
                       {group.products.map(p => {
                         const prod = products.find(prod => prod.id === p.id);
                         if (!prod) return null;
                         return (
                           <div key={prod.id} className="flex justify-between items-center font-bold tracking-wider relative group">
                              <span className={`${p.highlighted ? 'text-amber-500 font-black text-[1.4em] uppercase' : 'text-[#251a11] text-[1.25em]'} z-10`}>{prod.name}</span>
                              
                              {/* Dotted spacer */}
                              <div className="flex-1 border-b-2 border-dotted border-[#251a11]/40 mx-4 relative top-1" />

                              <div className="flex items-center gap-0 z-10 hover:scale-105 transition-transform">
                                 {/* Price tag */}
                                 <div className="bg-[#1c130c] border-[1px] border-[#3d2c1e] rounded shadow-[2px_2px_0px_rgba(0,0,0,0.3)] px-3 py-0.5">
                                    <span className="text-[#dfccb3] font-bold text-[1.25em] tracking-widest leading-none drop-shadow-md">
                                      R$ {prod.price.toFixed(2).replace('.', ',')}
                                    </span>
                                 </div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))
             )}
          </div>
          
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Bebas+Neue&family=Rye&family=Cinzel:wght@400;700&family=Special+Elite&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

        .bg-rust {
          background-color: #2b221d;
          background-image: url('https://www.transparenttextures.com/patterns/dark-matter.png');
        }

        .bg-parchment {
          background-color: #d8c3a5;
          /* Wood / paper mixed texture to feel like an old board/paper */
          background-image: 
             url('https://www.transparenttextures.com/patterns/wood-pattern.png'),
             radial-gradient(circle, rgba(230,212,185,1) 0%, rgba(181,154,124,1) 100%);
        }

        @page { size: A4; margin: 0; }
        @media print {
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            height: 297mm !important;
            width: 210mm !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          
          .print\\:hidden { display: none !important; }
          
          #printable-menu { 
             position: relative !important;
             display: block !important;
             top: 0 !important;
             left: 0 !important;
             width: 210mm !important;
             height: 297mm !important;
             margin: 0 !important;
             padding: 0 !important;
             overflow: hidden !important;
             border: none !important; 
             box-shadow: none !important;
             background-color: #d8c3a5 !important;
             background-image: url('https://www.transparenttextures.com/patterns/wood-pattern.png') !important;
          }

          /* Fix watermark size and position in print */
          #printable-menu > div:first-child {
             position: absolute !important;
             width: 210mm !important;
             height: 297mm !important;
             top: 0 !important;
             left: 0 !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
             z-index: 0 !important;
          }

          #printable-menu img {
             max-width: 180mm !important;
             max-height: 250mm !important;
             object-fit: contain !important;
          }

          /* Force Corner SVGs to stay in corners */
          #printable-menu .absolute.top-0.left-0 { top: 0 !important; left: 0 !important; position: absolute !important; z-index: 20 !important; display: block !important; }
          #printable-menu .absolute.top-0.right-0 { top: 0 !important; right: 0 !important; position: absolute !important; z-index: 20 !important; display: block !important; }
          #printable-menu .absolute.bottom-0.left-0 { bottom: 0 !important; left: 0 !important; position: absolute !important; z-index: 20 !important; display: block !important; }

          /* Force text visibility and layering */
          .px-16.py-16 {
             position: relative !important;
             z-index: 10 !important;
             display: flex !important;
             flex-direction: column !important;
             height: 297mm !important;
          }

          h1, h2, h3, span, p { 
             color: #1c120a !important; 
             opacity: 1 !important;
             visibility: visible !important;
             z-index: 15 !important;
             position: relative !important;
             -webkit-filter: none !important;
             filter: none !important;
          }

          .print\\:opacity-\\[0\\.12\\] { opacity: 0.12 !important; }
        }

        .force-bold h1, 
        .force-bold h2, 
        .force-bold span, 
        .force-bold p { 
           font-weight: 900 !important;
           -webkit-text-stroke: 0.5px #1c120a;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Save, Plus, Trash2, ChevronUp, ChevronDown, Wrench, Beer, 
  GlassWater, FlaskConical, Zap, Wind, Settings, ArrowLeft,
  Flame, Leaf, Coffee, Check, Search, Star
} from 'lucide-react';

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
  fontFamily?: string;
  fontSizeMultiplier?: number;
  fontWeightBold?: boolean;
  groups: MenuGroup[];
}

interface MenuConfig {
  pages: MenuPage[];
}

const AVAILABLE_ICONS = [
  { name: 'Wrench', icon: <Wrench size={20} /> },
  { name: 'Beer', icon: <Beer size={20} /> },
  { name: 'GlassWater', icon: <GlassWater size={20} /> },
  { name: 'FlaskConical', icon: <FlaskConical size={20} /> },
  { name: 'Zap', icon: <Zap size={20} /> },
  { name: 'Wind', icon: <Wind size={20} /> },
  { name: 'Flame', icon: <Flame size={20} /> },
  { name: 'Leaf', icon: <Leaf size={20} /> },
  { name: 'Coffee', icon: <Coffee size={20} /> },
  { name: 'Settings', icon: <Settings size={20} /> },
];

export default function MenuConfigManager() {
  const [config, setConfig] = useState<MenuConfig>({ pages: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Modal de Adicionar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [targetGroupPath, setTargetGroupPath] = useState<{pageIndex: number, groupIndex: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [settings, products] = await Promise.all([
          api.getSettings(),
          api.getProducts()
        ]);
        
        // Remove insumos
        const catalog = products.filter(p => {
          const cat = (p.category_name || '').toLowerCase();
          return p.type !== 'ingredient' && !cat.includes('insumo') && !cat.includes('matéria');
        });
        setAllProducts(catalog);

        if (settings.digital_menu_config) {
          try {
             const parsed = JSON.parse(settings.digital_menu_config);
             // Clean any products that no longer exist in the active catalog
             const activeIds = new Set(catalog.map(p => p.id));
             const cleaned = cleanConfig(parsed, activeIds);
             setConfig(cleaned);
          } catch(e) {
             console.error("Invalid config JSON");
          }
        } else {
          // Default empty config with 1 page
          setConfig({
            pages: [{
              id: 'p-' + Date.now(),
              title: '1. NOVA PÁGINA',
              watermark: '',
              watermarkOpacity: 35,
              watermarkSaturation: 100,
              fontFamily: "'Oswald', sans-serif",
              fontSizeMultiplier: 100,
              fontWeightBold: false,
              groups: []
            }]
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Removes products not in the active catalog from the config
  const cleanConfig = (cfg: MenuConfig, activeIds: Set<number>): MenuConfig => {
    return {
      ...cfg,
      pages: cfg.pages.map(page => ({
        ...page,
        groups: page.groups.map(group => ({
          ...group,
          products: group.products.filter(p => activeIds.has(p.id))
        }))
      }))
    };
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      // Before saving, clean any orphaned products that no longer exist
      const activeIds = new Set(allProducts.map(p => p.id));
      const cleaned = cleanConfig(config, activeIds);

      // Count how many were removed
      const countBefore = config.pages.reduce((s, pg) => s + pg.groups.reduce((s2, g) => s2 + g.products.length, 0), 0);
      const countAfter = cleaned.pages.reduce((s, pg) => s + pg.groups.reduce((s2, g) => s2 + g.products.length, 0), 0);
      const removed = countBefore - countAfter;

      setConfig(cleaned);
      await api.saveSettings({ digital_menu_config: JSON.stringify(cleaned) });

      if (removed > 0) {
        alert(`Configuração salva! ${removed} produto(s) removido(s) automaticamente por não existirem mais no catálogo ativo.`);
      } else {
        alert('Configuração salva com sucesso!');
      }
    } catch (e) {
      alert('Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  };

  // Funções Utilitárias Array (Mover Up/Down)
  const moveItem = (array: any[], index: number, direction: 'up' | 'down') => {
    const newArray = [...array];
    if (direction === 'up' && index > 0) {
      const temp = newArray[index];
      newArray[index] = newArray[index - 1];
      newArray[index - 1] = temp;
    } else if (direction === 'down' && index < newArray.length - 1) {
      const temp = newArray[index];
      newArray[index] = newArray[index + 1];
      newArray[index + 1] = temp;
    }
    return newArray;
  };

  const updatePage = (pIndex: number, newPage: MenuPage) => {
    const newPages = [...config.pages];
    newPages[pIndex] = newPage;
    setConfig({ pages: newPages });
  };

  const getProductName = (id: number) => allProducts.find(p => p.id === id)?.name || `Prod ${id}`;

  if (loading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl sticky top-4 z-40 shadow-2xl">
          <div className="flex items-center gap-4">
             <button onClick={() => window.close()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Fechar guia">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h1 className="text-2xl font-bold text-white">Construtor do Cardápio</h1>
                <p className="text-sm text-slate-400">Monte as páginas, defina a ordem e escolha quem aparece.</p>
             </div>
          </div>
          <button 
             onClick={handleSave} 
             disabled={saving}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
             <Save size={20} />
             {saving ? 'Salvando...' : 'Salvar Cardápio Público'}
          </button>
        </div>

        {/* LISTA DE PÁGINAS */}
        <div className="space-y-8">
           {config.pages.map((page, pIndex) => (
             <div key={page.id} className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                
                {/* CABEÇALHO DA PÁGINA */}
                <div className="bg-slate-800/80 p-4 flex gap-4 items-start border-b border-slate-700">
                   <div className="flex flex-col gap-1 shrink-0">
                      <button disabled={pIndex === 0} onClick={() => setConfig({ pages: moveItem(config.pages, pIndex, 'up') })} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 bg-slate-900 rounded"><ChevronUp size={20} /></button>
                      <button disabled={pIndex === config.pages.length - 1} onClick={() => setConfig({ pages: moveItem(config.pages, pIndex, 'down') })} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 bg-slate-900 rounded"><ChevronDown size={20} /></button>
                   </div>
                   
                   <div className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Título da Página</label>
                            <input 
                              value={page.title} 
                              onChange={e => updatePage(pIndex, { ...page, title: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                              placeholder="Ex: 1. COMIDAS"
                            />
                         </div>
                         <div>
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Fonte da Letra</label>
                            <select 
                              value={page.fontFamily || "'Oswald', sans-serif"}
                              onChange={e => updatePage(pIndex, { ...page, fontFamily: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                            >
                               <option value="'Oswald', sans-serif">Oswald (Padrão)</option>
                               <option value="'Bebas Neue', sans-serif">Bebas Neue (Forte)</option>
                               <option value="'Rye', serif">Rye (Faroeste/Madeira)</option>
                               <option value="'Cinzel', serif">Cinzel (Clássica/Chique)</option>
                               <option value="'Special Elite', monospace">Special Elite (Máquina Antiga)</option>
                               <option value="'Playfair Display', serif">Playfair Display (Elegante)</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-1">URL Marca D'água</label>
                            <input 
                              value={page.watermark} 
                              onChange={e => updatePage(pIndex, { ...page, watermark: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="https://..."
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-3 rounded-lg">
                         <div>
                            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Tamanho Global da Letra: {page.fontSizeMultiplier ?? 100}%</label>
                            <input 
                              type="range" min="60" max="180" 
                              value={page.fontSizeMultiplier ?? 100} 
                              onChange={e => updatePage(pIndex, { ...page, fontSizeMultiplier: Number(e.target.value) })}
                              className="w-full accent-blue-500"
                            />
                         </div>
                         <div className="flex items-center gap-3">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                               <input 
                                 type="checkbox" 
                                 checked={page.fontWeightBold ?? false}
                                 onChange={e => updatePage(pIndex, { ...page, fontWeightBold: e.target.checked })}
                                 className="w-5 h-5 accent-blue-500"
                               />
                               <span className="text-sm uppercase text-slate-400 font-bold">Forçar Texto Negrito (Todas)</span>
                            </label>
                         </div>
                      </div>
                      
                      {page.watermark && (
                        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                           <div>
                              <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Opacidade (%): {page.watermarkOpacity ?? 35}%</label>
                              <div className="flex items-center gap-3">
                                 <input 
                                    type="range" min="5" max="100" 
                                    value={page.watermarkOpacity ?? 35} 
                                    onChange={e => updatePage(pIndex, { ...page, watermarkOpacity: Number(e.target.value) })}
                                    className="flex-1 accent-blue-500"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Cor (Saturação): {page.watermarkSaturation ?? 100}%</label>
                              <div className="flex items-center gap-3">
                                 <input 
                                    type="range" min="0" max="200" 
                                    value={page.watermarkSaturation ?? 100} 
                                    onChange={e => updatePage(pIndex, { ...page, watermarkSaturation: Number(e.target.value) })}
                                    className="flex-1 accent-emerald-500"
                                 />
                              </div>
                           </div>
                        </div>
                      )}
                   </div>

                   <button 
                     onClick={() => {
                        if(confirm('Tem certeza que deseja apagar essa folha inteira?')) {
                           setConfig({ pages: config.pages.filter((_, i) => i !== pIndex) });
                        }
                     }}
                     className="p-3 bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded-xl transition-colors shrink-0"
                   >
                      <Trash2 size={24} />
                   </button>
                </div>

                {/* GRUPOS DA PÁGINA */}
                <div className="p-6 space-y-6">
                   {page.groups.map((group, gIndex) => (
                      <div key={group.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4">
                         
                         {/* COLS: ORDENAÇÃO DO GRUPO */}
                         <div className="flex flex-col gap-1 shrink-0 pt-2">
                           <button disabled={gIndex === 0} onClick={() => {
                              const newGroups = moveItem(page.groups, gIndex, 'up');
                              updatePage(pIndex, { ...page, groups: newGroups });
                           }} className="p-1 text-slate-600 hover:text-white disabled:opacity-20 bg-slate-900 rounded"><ChevronUp size={16} /></button>
                           <button disabled={gIndex === page.groups.length - 1} onClick={() => {
                              const newGroups = moveItem(page.groups, gIndex, 'down');
                              updatePage(pIndex, { ...page, groups: newGroups });
                           }} className="p-1 text-slate-600 hover:text-white disabled:opacity-20 bg-slate-900 rounded"><ChevronDown size={16} /></button>
                         </div>

                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                               <div className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900 p-1 gap-1">
                                  {AVAILABLE_ICONS.map(ic => (
                                     <button 
                                        key={ic.name} 
                                        onClick={() => {
                                           const newGroups = [...page.groups];
                                           newGroups[gIndex].iconName = ic.name;
                                           updatePage(pIndex, { ...page, groups: newGroups });
                                        }}
                                        className={`p-1.5 rounded transition-colors ${group.iconName === ic.name ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                     >
                                        {ic.icon}
                                     </button>
                                  ))}
                               </div>
                               <div className="flex-1">
                                  <input 
                                     value={group.name} 
                                     onChange={e => {
                                        const newGroups = [...page.groups];
                                        newGroups[gIndex].name = e.target.value;
                                        updatePage(pIndex, { ...page, groups: newGroups });
                                     }}
                                     className="w-full bg-slate-900 border-none border-b-2 focus:border-blue-500 px-3 py-1 text-lg font-bold text-slate-200 outline-none"
                                     placeholder="Ex: Sub: Porções (Mín 2 letras)"
                                  />
                               </div>
                               <button 
                                 onClick={() => {
                                    if(confirm('Excluir este subgrupo e remover todos os produtos dele desta folha?')) {
                                       const newGroups = page.groups.filter((_, i) => i !== gIndex);
                                       updatePage(pIndex, { ...page, groups: newGroups });
                                    }
                                 }}
                                 className="text-slate-600 hover:text-red-400 p-2"
                               >
                                  <Trash2 size={18} />
                               </button>
                            </div>

                            {/* PRODUTOS NESTE GRUPO */}
                            <div className="space-y-1">
                               {group.products.map((prod, prodIndex) => (
                                  <div key={`${prod.id}-${prodIndex}`} className="flex items-center gap-2 bg-slate-900 px-3 py-2 border border-slate-800 rounded-lg group hover:border-slate-600">
                                     <button disabled={prodIndex === 0} onClick={() => {
                                        const newGroups = [...page.groups];
                                        newGroups[gIndex].products = moveItem(newGroups[gIndex].products, prodIndex, 'up');
                                        updatePage(pIndex, { ...page, groups: newGroups });
                                     }} className="text-slate-600 hover:text-white disabled:opacity-20"><ChevronUp size={16} /></button>
                                     <button disabled={prodIndex === group.products.length - 1} onClick={() => {
                                        const newGroups = [...page.groups];
                                        newGroups[gIndex].products = moveItem(newGroups[gIndex].products, prodIndex, 'down');
                                        updatePage(pIndex, { ...page, groups: newGroups });
                                     }} className="text-slate-600 hover:text-white disabled:opacity-20"><ChevronDown size={16} /></button>
                                     
                                     <span className={`flex-1 pl-2 ${prod.highlighted ? 'font-black text-amber-400 uppercase tracking-wider text-xl' : 'text-slate-300'}`}>
                                        {getProductName(prod.id)}
                                     </span>

                                     <button 
                                        onClick={() => {
                                           const newGroups = [...page.groups];
                                           newGroups[gIndex].products[prodIndex].highlighted = !prod.highlighted;
                                           updatePage(pIndex, { ...page, groups: newGroups });
                                        }}
                                        className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${prod.highlighted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:bg-slate-800'}`}
                                        title="Pintar de cor especial no Cardápio"
                                     >
                                        <Star size={16} fill={prod.highlighted ? "currentColor" : "none"} />
                                        Destaque
                                     </button>

                                     <button 
                                        onClick={() => {
                                           const newGroups = [...page.groups];
                                           newGroups[gIndex].products = newGroups[gIndex].products.filter((_, i) => i !== prodIndex);
                                           updatePage(pIndex, { ...page, groups: newGroups });
                                        }}
                                        className="text-slate-600 hover:text-red-400 p-1 bg-slate-800/50 rounded ml-2"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                  </div>
                               ))}

                               {group.products.length === 0 && (
                                  <div className="text-sm text-slate-500 py-2 italic ml-10">Use o botão abaixo para incluir itens do seu estoque nesta subcategoria.</div>
                               )}

                               <button 
                                 onClick={() => {
                                    setTargetGroupPath({ pageIndex: pIndex, groupIndex: gIndex });
                                    setSearchQuery('');
                                    setIsProductModalOpen(true);
                                 }}
                                 className="ml-8 mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-900/40 w-max transition-colors"
                               >
                                  <Plus size={16} /> ADICIONAR PRODUTOS AQUI
                               </button>
                            </div>

                         </div>
                      </div>
                   ))}

                   <button 
                     onClick={() => {
                        const newGroups = [...page.groups, { id: 'g-' + Date.now(), name: 'Sub: Nova Categoria', iconName: 'Settings', products: [] }];
                        updatePage(pIndex, { ...page, groups: newGroups });
                     }}
                     className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 rounded-xl font-bold flex flex-col items-center gap-2 transition-colors"
                   >
                     <Plus size={24} /> Criar Novo Subgrupo (Ex: Sub: Porções)
                   </button>

                </div>
             </div>
           ))}

           <button 
             onClick={() => {
                setConfig({ pages: [...config.pages, { id: 'p-' + Date.now(), title: `${config.pages.length + 1}. NOVA FOLHA`, watermark: '', watermarkOpacity: 35, watermarkSaturation: 100, fontFamily: "'Oswald', sans-serif", fontSizeMultiplier: 100, fontWeightBold: false, groups: [] }]});
             }}
             className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-blue-500/50 text-slate-500 hover:border-blue-400 rounded-2xl font-black text-xl tracking-widest flex flex-col items-center gap-2 transition-all bg-slate-900/50 hover:bg-slate-900"
           >
             <Plus size={32} /> ADICIONAR NOVA FOLHA EM BRANCO NO FIM
           </button>
        </div>
      </div>

      {/* MODAL DE ADICIONAR PRODUTOS */}
      {isProductModalOpen && targetGroupPath && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
               
               <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-white">Catálogo de Produtos</h3>
                    <p className="text-xs text-slate-400">Clique no produto para adicioná-lo ao final do grupo selecionado.</p>
                  </div>
                  <button onClick={() => setIsProductModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-white">Concluído</button>
               </div>

               <div className="p-4 border-b border-slate-800 bg-slate-950">
                  <div className="relative">
                     <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                     <input 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       placeholder="Buscar por nome ou categoria..."
                       className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                       autoFocus
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                  {['Sem Categoria', ...Array.from(new Set(allProducts.map(p => p.category_name || 'Sem Categoria'))).filter(c => c !== 'Sem Categoria').sort()].map(cat => {
                     const prods = allProducts.filter(p => (p.category_name || 'Sem Categoria') === cat && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
                     if (prods.length === 0) return null;

                     return (
                        <div key={cat} className="mb-6">
                           <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase border-b border-slate-800 pb-1">{cat}</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {prods.map(p => (
                                 <button 
                                   key={p.id}
                                   onClick={() => {
                                      // ADICIONAR AO GRUPO
                                      const { pageIndex, groupIndex } = targetGroupPath;
                                      const newConfig = { ...config };
                                      const targetGroup = newConfig.pages[pageIndex].groups[groupIndex];
                                      
                                      // Verifica se já não foi adicionado
                                      if (targetGroup.products.find(x => x.id === p.id)) {
                                         alert('Este item já está nesse subgrupo!');
                                         return;
                                      }

                                      targetGroup.products.push({ id: p.id, highlighted: false });
                                      setConfig(newConfig);
                                   }}
                                   className="text-left bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-blue-500 hover:bg-slate-800 transition-colors flex justify-between items-center group"
                                 >
                                   <div>
                                      <div className="font-bold text-slate-200 text-sm">{p.name}</div>
                                      <div className="text-xs text-slate-500">R$ {p.price?.toFixed(2)}</div>
                                   </div>
                                   <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 group-hover:bg-blue-600 group-hover:border-blue-500 flex items-center justify-center text-transparent group-hover:text-white transition-colors">
                                      <Plus size={14} />
                                   </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                     )
                  })}
               </div>

            </div>
         </div>
      )}

    </div>
  );
}

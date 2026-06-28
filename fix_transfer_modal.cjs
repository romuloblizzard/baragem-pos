const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find start and end of the broken Transfer Modal section
const startMarker = '      {/* Merge Order Modal */}\r\n      {/* Transfer Order Modal */}';
const endMarker = '      )}\r\n\r\n      {/* Fix Pulseira Modal */}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) { console.error('START not found'); process.exit(1); }
if (endIdx === -1) { console.error('END not found'); process.exit(1); }

console.log('Start at:', startIdx, 'End at:', endIdx);
console.log('Section length:', endIdx - startIdx);

const newModal = `      {/* Merge Order Modal */}
      {/* Transfer Order Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Enviar para Fixa</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Todos os itens da comanda <span className="text-white font-bold">#{pulseira}</span> serão transferidos para a comanda fixa do cliente selecionado. Esta comanda ficará livre.
            </p>

            {/* Corrigir número da pulseira */}
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">?? Corrigir Número da Pulseira</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Nº correto"
                  defaultValue={pulseira}
                  id="transfer-pulseira-correction"
                  className="flex-1 bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-2 text-white font-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                  onChange={(e) => {
                    const el = document.getElementById('transfer-pulseira-correction') as HTMLInputElement;
                    if (el) el.value = e.target.value.replace(/\\D/g, '').slice(0, 4);
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('transfer-pulseira-correction') as HTMLInputElement;
                    const novo = (el?.value || '').replace(/\\D/g, '').padStart(4, '0');
                    if (!novo || novo === '0000') { alert('Digite um número válido.'); return; }
                    if (novo === pulseira) { alert('O número é o mesmo. Nada a corrigir.'); return; }
                    if (!window.confirm('Confirma a correção da pulseira?\\n\\nDe: #' + pulseira + '\\nPara: #' + novo + '\\n\\nA tela será recarregada com o novo número.')) return;
                    setIsTransferModalOpen(false);
                    setTransferSearch('');
                    setTransferResults([]);
                    setPulseira(novo);
                    setCurrentOrder(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg font-bold text-sm transition-all"
                >
                  Corrigir
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">Use quando digitou o número errado ao abrir a comanda.</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Buscar por nome ou nº da pulseira..."
                value={transferSearch}
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  setTransferSearch(val);
                  if (val.length < 2) { setTransferResults([]); return; }
                  try {
                    const [emps, custs] = await Promise.all([
                      api.getEmployees(),
                      api.searchCustomers(val),
                    ]);
                    const fixedEmps = emps
                      .filter((emp: any) => emp.fixed_pulseira && emp.name.toLowerCase().includes(val.toLowerCase()))
                      .map((emp: any) => ({ ...emp, _type: 'employee' }));
                    const fixedCusts = custs
                      .filter((c: any) => c.fixed_pulseira)
                      .map((c: any) => ({ ...c, _type: 'customer' }));
                    const allFixed = await api.getFixedCustomers();
                    const byPulseira = allFixed
                      .filter((c: any) => c.fixed_pulseira?.includes(val))
                      .map((c: any) => ({ ...c, _type: 'customer' }));
                    const combined = [...fixedEmps, ...fixedCusts, ...byPulseira];
                    const unique = combined.filter((v, i, a) => a.findIndex(x => x.id === v.id && x._type === v._type) === i);
                    setTransferResults(unique.slice(0, 8));
                  } catch (e) { console.error(e); }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                autoFocus
              />

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {transferResults.map((person: any) => (
                  <button
                    key={\`\${person._type}-\${person.id}\`}
                    disabled={isTransferring}
                    onClick={async () => {
                      if (!currentOrder) return;
                      if (!confirm(\`Enviar comanda #\${pulseira} para \${person.name} (pulseira fixa #\${person.fixed_pulseira})?\`)) return;
                      setIsTransferring(true);
                      try {
                        const result = await api.transferOrder(currentOrder.id, person.fixed_pulseira);
                        setIsTransferModalOpen(false);
                        setView('home');
                        setPulseira('');
                        setCurrentOrder(null);
                        loadOpenOrders();
                        alert(\`Comanda transferida para \${person.name} (#\${result.destPulseira})!\`);
                      } catch (err: any) {
                        alert(err.message || 'Erro ao transferir comanda.');
                      } finally {
                        setIsTransferring(false);
                      }
                    }}
                    className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl p-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={\`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black \${person._type === 'employee' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}\`}>
                        {person._type === 'employee' ? 'FUNC' : 'CLI'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 group-hover:text-white">{person.name}</p>
                        <p className="text-xs text-slate-500">Pulseira fixa #{person.fixed_pulseira}</p>
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-violet-400 rotate-180" />
                  </button>
                ))}
                {transferSearch.length >= 2 && transferResults.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">Nenhum cliente/funcionário fixo encontrado.</p>
                )}
                {transferSearch.length < 2 && (
                  <p className="text-center text-slate-600 text-xs py-3">Digite pelo menos 2 caracteres para buscar</p>
                )}
              </div>

              {isTransferring && (
                <p className="text-center text-violet-400 text-sm animate-pulse">Transferindo...</p>
              )}

              <button onClick={() => setIsTransferModalOpen(false)} className="w-full py-2 text-slate-400 hover:text-white text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}\r\n\r\n      {/* Fix Pulseira Modal */}`;

content = content.substring(0, startIdx) + newModal + content.substring(endIdx + endMarker.length);
fs.writeFileSync(file, content);
console.log('Done! Transfer modal rebuilt successfully.');

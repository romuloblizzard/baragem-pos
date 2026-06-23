const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldModal = `{/* Modal de Confirmacao de Pedido */}
        {showCartConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                <h3 className="text-xl font-bold text-center text-white">Confirmar Pedido</h3>
                <p className="text-center text-sm text-slate-400">Comanda <span className="text-emerald-400 font-bold">#{pulseira}</span></p>
                <p className="text-center text-xs text-slate-500 uppercase mt-1">Atendente: {localStorage.getItem('pos_employee_name') || 'Desconhecido'}</p>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-900">
                {cart.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between items-center text-slate-300">
                      <span><span className="font-bold text-emerald-400">{item.quantity}x</span> {item.name}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="pl-4 mt-1 border-l-2 border-slate-700">
                        {item.modifiers.map((m, mIdx) => (
                          <div key={mIdx} className="text-[11px] text-slate-500">
                            - {m.product_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                <button 
                  onClick={() => setShowCartConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setShowCartConfirmModal(false);
                    submitOrder();
                  }}
                  disabled={isSubmittingOrder}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
                >
                  Confirmar e Enviar
                </button>
              </div>
            </div>
          </div>
        )}`;

const newModal = `{/* Modal de Confirmacao de Pedido - Visual de Ticket Impresso */}
        {showCartConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#fcfcfc] w-full max-w-[300px] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col font-mono text-black my-auto" style={{boxShadow: "0px 10px 30px rgba(0,0,0,0.5)"}}>
              
              {/* Topo do Ticket em zigue-zague simulando papel cortado (opcional, mas da charme) */}
              <div className="w-full h-3 bg-repeat-x" style={{backgroundImage: "radial-gradient(circle, #fcfcfc 4px, transparent 5px)", backgroundSize: "10px 10px", backgroundPosition: "top center", marginTop: "-5px"}}></div>

              <div className="p-4 pb-6 flex flex-col items-center">
                <div className="text-center font-black text-lg leading-tight mb-3">
                  BARAGEM<br/>
                  TICKET DE PRODUÇÃO
                </div>

                <div className="w-full border-b border-dashed border-black mb-3"></div>

                <div className="text-center w-full mb-3">
                  <div className="text-[11px] mb-1">PULSEIRA / COMANDA:</div>
                  <div className="text-3xl font-black border-2 border-black inline-block px-3 py-1 mb-2">#{pulseira || '0000'}</div>
                  {currentOrder?.customer_name && (
                    <div className="font-bold text-sm mt-1">{currentOrder.customer_name}</div>
                  )}
                  <div className="text-[12px] mt-2 font-black uppercase border-t border-dashed border-black pt-2">
                    ATENDENTE: {localStorage.getItem('pos_employee_name') || 'Desconhecido'}
                  </div>
                </div>

                <div className="w-full border-b border-dashed border-black mb-3"></div>

                <div className="w-full space-y-2 mb-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-bold">
                        {item.quantity}x {item.name}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="pl-3 mt-0.5 text-xs">
                          {item.modifiers.map((m, mIdx) => (
                            <div key={mIdx}>+ {m.product_name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="w-full border-b border-dashed border-black mb-3"></div>
                
                <div className="text-[11px] w-full text-center">
                  Data: {new Date().toLocaleDateString('pt-BR')} - Hora: {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </div>

              </div>

              {/* Botões do Modal */}
              <div className="bg-slate-900 p-3 flex gap-2 w-full mt-auto">
                <button 
                  onClick={() => setShowCartConfirmModal(false)}
                  className="flex-1 py-3 rounded text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setShowCartConfirmModal(false);
                    submitOrder();
                  }}
                  disabled={isSubmittingOrder}
                  className="flex-1 py-3 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex justify-center items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Confirmar Pedido
                </button>
              </div>

            </div>
          </div>
        )}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync(file, content);
console.log("Updated Waiter.tsx with realistic print layout modal.");

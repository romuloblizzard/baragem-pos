const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  "const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);",
  "const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);\n  const [showCartConfirmModal, setShowCartConfirmModal] = useState(false);"
);

// 2. Remove alert
content = content.replace(
  "setProducts(prods);\n      alert('Pedido enviado!');",
  "setProducts(prods);\n      // alert('Pedido enviado!'); removido a pedido"
);

// 3. Change Confirm button onClick
content = content.replace(
  /onClick=\{submitOrder\}\n\s*disabled=\{isSubmittingOrder/g,
  "onClick={() => setShowCartConfirmModal(true)}\n              disabled={isSubmittingOrder"
);

// 4. Add the new Modal before Payment Modal
const modalCode = `

        {/* Modal de Confirmacao de Pedido */}
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
        )}

        {/* Payment Modal */}
`;

content = content.replace("{/* Payment Modal */}", modalCode);

fs.writeFileSync(file, content);
console.log('Done replacing Waiter.tsx');

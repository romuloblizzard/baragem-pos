const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace the conditional main button (CRLF-aware)
const oldMainBtn = `          <div className="flex gap-2">\r\n            {currentTotal <= 0 ? (\r\n              <button\r\n                onClick={handleCloseZeroOrder}\r\n                disabled={isLoading}\r\n                className="flex-1 py-3 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded-lg text-sm font-bold transition-colors border border-red-800/50 hover:border-red-600 disabled:opacity-50"\r\n              >\r\n                \uD83D\uDEAB Encerrar Sem Cobran\u00E7a\r\n              </button>\r\n            ) : (\r\n              <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">\r\n                Fechar Conta\r\n              </button>\r\n            )}`;

const newMainBtn = `          <div className="flex gap-2">\r\n            <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">\r\n              Fechar Conta\r\n            </button>`;

if (!content.includes(oldMainBtn)) {
  console.error('ERROR: main btn not found. Trying regex...');
  // Use regex fallback
  content = content.replace(
    /\s+\{currentTotal <= 0 \? \([\s\S]*?\) : \(\s*<button onClick=\{openPaymentModal\}[^>]*>\s*Fechar Conta\s*<\/button>\s*\)\}/,
    `\r\n            <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">\r\n              Fechar Conta\r\n            </button>`
  );
  console.log('Regex applied for main btn');
} else {
  content = content.replace(oldMainBtn, newMainBtn);
  console.log('Main btn replaced successfully');
}

// 2. Add zero-close button inside modal before Cancelar
const oldCancel = `              <button\r\n                onClick={() => { setIsPaymentModalOpen(false); setSplitEntries([]); setSplitInputAmount(''); }}\r\n                className="w-full py-2 text-slate-400 hover:text-white transition-colors"\r\n              >\r\n                Cancelar\r\n              </button>`;

const newCancel = `              {/* Encerrar sem cobranca - so aparece se total = R$0 */}\r\n              {ordersToPay.length > 0 && ordersToPay.every((o: any) => (o.items || []).reduce((s: number, i: any) => s + (i.price_at_time * i.quantity), 0) === 0) && (\r\n                <button\r\n                  onClick={async () => {\r\n                    if (!currentOrder) return;\r\n                    if (!window.confirm('Encerrar a comanda #' + pulseira + ' sem cobranca? Ela nao possui consumo registrado.')) return;\r\n                    setIsLoading(true);\r\n                    try {\r\n                      await api.closeZeroOrder(currentOrder.id);\r\n                      setIsPaymentModalOpen(false);\r\n                      setSplitEntries([]);\r\n                      setSplitInputAmount('');\r\n                      setOrdersToPay([]);\r\n                      setView('home');\r\n                      setPulseira('');\r\n                      setCurrentOrder(null);\r\n                      loadOpenOrders();\r\n                    } catch (err: any) {\r\n                      alert(err.message || 'Erro ao encerrar comanda.');\r\n                    } finally {\r\n                      setIsLoading(false);\r\n                    }\r\n                  }}\r\n                  disabled={isLoading}\r\n                  className="w-full py-2.5 bg-red-900/30 hover:bg-red-800/50 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition-colors border border-red-800/40 hover:border-red-600 disabled:opacity-50"\r\n                >\r\n                  Encerrar Sem Cobranca\r\n                </button>\r\n              )}\r\n              <button\r\n                onClick={() => { setIsPaymentModalOpen(false); setSplitEntries([]); setSplitInputAmount(''); }}\r\n                className="w-full py-2 text-slate-400 hover:text-white transition-colors"\r\n              >\r\n                Cancelar\r\n              </button>`;

if (!content.includes(oldCancel)) {
  console.error('ERROR: cancel btn not found!');
  process.exit(1);
}
content = content.replace(oldCancel, newCancel);
console.log('Cancel btn replaced with zero-close option');

fs.writeFileSync(file, content);
console.log('All done!');

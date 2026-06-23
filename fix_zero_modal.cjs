const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Reverter o botao da tela principal (remover o condicional)
const oldMainBtn = `          <div className="flex gap-2">
            {currentTotal <= 0 ? (
              <button
                onClick={handleCloseZeroOrder}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded-lg text-sm font-bold transition-colors border border-red-800/50 hover:border-red-600 disabled:opacity-50"
              >
                ?? Encerrar Sem Cobrança
              </button>
            ) : (
              <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">
                Fechar Conta
              </button>
            )}`;

const newMainBtn = `          <div className="flex gap-2">
            <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">
              Fechar Conta
            </button>`;

if (!content.includes(oldMainBtn)) {
  console.error('ERROR: oldMainBtn not found!');
  process.exit(1);
}
content = content.replace(oldMainBtn, newMainBtn);

// 2. Adicionar botao "Encerrar Sem Cobranca" dentro do modal, acima do Cancelar
const oldCancelBtn = `              <button
                onClick={() => { setIsPaymentModalOpen(false); setSplitEntries([]); setSplitInputAmount(''); }}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>`;

const newCancelBtn = `              {/* Encerrar sem cobranca - aparece quando total = R$ 0,00 */}
              {ordersToPay.length > 0 && ordersToPay.every((o: any) => (o.items || []).reduce((s: number, i: any) => s + (i.price_at_time * i.quantity), 0) === 0) && (
                <button
                  onClick={async () => {
                    if (!currentOrder) return;
                    if (!window.confirm('Encerrar a comanda #' + pulseira + ' sem cobrança? Ela não possui consumo registrado.')) return;
                    setIsLoading(true);
                    try {
                      await api.closeZeroOrder(currentOrder.id);
                      setIsPaymentModalOpen(false);
                      setSplitEntries([]);
                      setSplitInputAmount('');
                      setOrdersToPay([]);
                      setView('home');
                      setPulseira('');
                      setCurrentOrder(null);
                      loadOpenOrders();
                    } catch (err: any) {
                      alert(err.message || 'Erro ao encerrar comanda.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-red-900/30 hover:bg-red-800/50 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition-colors border border-red-800/40 hover:border-red-600 disabled:opacity-50"
                >
                  ?? Encerrar Sem Cobrança
                </button>
              )}
              <button
                onClick={() => { setIsPaymentModalOpen(false); setSplitEntries([]); setSplitInputAmount(''); }}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>`;

if (!content.includes(oldCancelBtn)) {
  console.error('ERROR: oldCancelBtn not found!');
  process.exit(1);
}
content = content.replace(oldCancelBtn, newCancelBtn);

fs.writeFileSync(file, content);
console.log('Done! Both changes applied successfully.');

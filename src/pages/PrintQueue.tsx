import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { ChevronLeft, Printer, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function PrintQueue() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [status, setStatus] = useState('Monitorando novos pedidos...');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeItemToPrint, setActiveItemToPrint] = useState<any | null>(null);
  const [totalPrinted, setTotalPrinted] = useState(0);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const isPrintingRef = useRef(false);

  // Detecta se está rodando com --kiosk-printing (sem barra de endereço e sem menus)
  useEffect(() => {
    // Se não houver barra de endereço do Chrome, provavelmente está em modo app/kiosk
    const isAppMode = window.outerHeight - window.innerHeight < 100;
    setIsKioskMode(isAppMode);
  }, []);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 80));
  };

  useEffect(() => {
    // Busca itens pendentes a cada 3 segundos
    const interval = setInterval(async () => {
      if (isPrintingRef.current) return;
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            notes,
            created_at,
            products(name, categories(name)),
            orders(pulseira, customer_name)
          `)
          .eq('printed', false)
          .order('id', { ascending: true })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const item = data[0];
          isPrintingRef.current = true;
          setIsPrinting(true);
          setStatus(`Imprimindo: ${parseFloat(item.quantity)}x ${(item.products as any)?.name} (Pulseira ${(item.orders as any)?.pulseira})...`);
          addLog(`📋 Novo item: ${parseFloat(item.quantity)}x ${(item.products as any)?.name} - Pulseira ${(item.orders as any)?.pulseira}`, 'info');

          // Dispara impressão
          await printItem(item);

          // Marca como impresso no banco
          const { error: updateError } = await supabase
            .from('order_items')
            .update({ printed: true })
            .eq('id', item.id);

          if (updateError) throw updateError;

          setTotalPrinted(prev => prev + 1);
          addLog(`✅ Item #${item.id} impresso com sucesso!`, 'success');
          setStatus('Monitorando novos pedidos...');
        }
      } catch (err: any) {
        addLog(`❌ Erro: ${err.message || err}`, 'error');
        setStatus('Erro na fila. Verificando...');
      } finally {
        isPrintingRef.current = false;
        setIsPrinting(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const printItem = (item: any): Promise<void> => {
    return new Promise<void>((resolve) => {
      setActiveItemToPrint(item);

      // Aguarda React renderizar o conteúdo antes de imprimir
      setTimeout(() => {
        window.focus();
        window.print();

        // Aguarda o diálogo/impressão antes de liberar a fila
        setTimeout(() => {
          setActiveItemToPrint(null);
          resolve();
        }, 1500);
      }, 400);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 flex flex-col items-center">

      {/* Estilos para impressão em 80mm - apenas o cupom é exibido */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Oculta toda a interface visual */
          body > * { display: none !important; }
          body #print-root { display: block !important; }

          /* Fallback: método legado de visibilidade */
          body * {
            visibility: hidden !important;
            background: transparent !important;
          }
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 76mm !important;
            margin: 0 !important;
            padding: 4px !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 13px !important;
            line-height: 1.3 !important;
            color: #000 !important;
            background: white !important;
          }
          .c-center { text-align: center !important; }
          .c-bold { font-weight: bold !important; }
          .c-header {
            font-size: 15px !important;
            border-bottom: 1px dashed #000 !important;
            padding-bottom: 5px !important;
            margin-bottom: 10px !important;
          }
          .c-item {
            font-size: 20px !important;
            font-weight: bold !important;
            margin: 12px 0 !important;
            padding: 4px 0 !important;
          }
          .c-pulseira {
            font-size: 28px !important;
            font-weight: bold !important;
            border: 3px solid #000 !important;
            padding: 6px 14px !important;
            display: inline-block !important;
            margin: 6px 0 !important;
            letter-spacing: 2px !important;
          }
          .c-section {
            border-top: 1px dashed #000 !important;
            margin-top: 8px !important;
            padding-top: 6px !important;
            font-size: 12px !important;
          }
          .c-notes {
            background: #f5f5f5 !important;
            border: 1px solid #ccc !important;
            padding: 4px !important;
            margin-top: 6px !important;
            font-style: italic !important;
          }
        }
      `}} />

      {/* Conteiner de Impressão (invisível na tela, visível apenas na impressão) */}
      {activeItemToPrint && (
        <div id="print-section" style={{ display: 'none' }}>
          <div className="c-center c-header c-bold">
            BARAGEM<br/>TICKET DE PRODUÇÃO
          </div>

          <div className="c-center">
            <div style={{ fontSize: '11px', marginBottom: '2px' }}>PULSEIRA / COMANDA:</div>
            <div className="c-pulseira">#{activeItemToPrint.orders?.pulseira || '0000'}</div>
            {activeItemToPrint.orders?.customer_name && (
              <div className="c-bold" style={{ marginTop: '4px' }}>
                {activeItemToPrint.orders.customer_name}
              </div>
            )}
          </div>

          <div className="c-item c-center">
            {parseFloat(activeItemToPrint.quantity)}x {activeItemToPrint.products?.name}
          </div>

          {activeItemToPrint.notes && (
            <div className="c-notes">
              OBS: {activeItemToPrint.notes}
            </div>
          )}

          {activeItemToPrint.products?.categories?.name && (
            <div className="c-section">
              Setor: <strong>{activeItemToPrint.products.categories.name}</strong>
            </div>
          )}

          <div className="c-section c-center">
            {new Date(activeItemToPrint.created_at || Date.now()).toLocaleDateString('pt-BR')} -{' '}
            {new Date(activeItemToPrint.created_at || Date.now()).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      )}

      {/* Interface Visual */}
      <div className="w-full max-w-2xl flex flex-col gap-4" style={{ minHeight: '100vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <Link to="/" className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Printer size={24} className="text-emerald-400" />
              Fila de Impressão
            </h1>
            <p className="text-sm text-slate-500">Deixe esta janela aberta no PC conectado à impressora</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <span className={`w-3 h-3 rounded-full ${isPrinting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-slate-400">{isPrinting ? 'IMPRIMINDO' : 'MONITORANDO'}</span>
          </div>
        </div>

        {/* Aviso de modo de impressão */}
        {!isKioskMode && (
          <div className="bg-amber-950 border border-amber-700 rounded-2xl p-4 flex gap-3 items-start">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-amber-300 font-bold text-sm">Atenção: Impressão com diálogo ativo</p>
              <p className="text-amber-400/80 text-xs mt-1">
                Neste modo, o Chrome vai abrir a janela de confirmação a cada impressão.
                Para imprimir <strong>sem nenhuma pergunta</strong>, feche este Chrome e use o atalho
                <strong className="text-amber-300"> "BARAGEM IMPRESSORA"</strong> que está na sua Área de Trabalho.
              </p>
            </div>
          </div>
        )}

        {isKioskMode && (
          <div className="bg-emerald-950 border border-emerald-700 rounded-2xl p-4 flex gap-3 items-center">
            <CheckCircle className="text-emerald-400 shrink-0" size={20} />
            <div>
              <p className="text-emerald-300 font-bold text-sm">Modo impressão direta ativo!</p>
              <p className="text-emerald-400/80 text-xs">Pedidos serão impressos automaticamente, sem nenhuma confirmação.</p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-2">Status</p>
          <p className="text-lg font-bold text-slate-200">{status}</p>
          <p className="text-xs text-slate-600 mt-2">
            Total impresso nesta sessão: <span className="text-emerald-400 font-bold">{totalPrinted}</span>
          </p>
        </div>

        {/* Log Console */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-1 flex flex-col-reverse" style={{ minHeight: '300px', maxHeight: '45vh' }}>
          {logs.length === 0 ? (
            <p className="text-slate-600 italic text-center py-8">Aguardando pedidos...</p>
          ) : (
            logs.map((log, i) => (
              <p
                key={i}
                className={
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('✅') ? 'text-emerald-400' :
                  log.includes('📋') ? 'text-blue-400' :
                  'text-slate-500'
                }
              >
                {log}
              </p>
            ))
          )}
        </div>

        {/* Instruções */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 items-start">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-400">Como usar a impressão automática sem diálogo:</p>
            <p>1. Procure o ícone <strong className="text-white">"BARAGEM IMPRESSORA"</strong> na Área de Trabalho</p>
            <p>2. Clique duas vezes nele (esse atalho já tem o parâmetro <code className="bg-slate-800 text-amber-400 px-1 rounded">--kiosk-printing</code>)</p>
            <p>3. Deixe essa janela aberta — ela monitora e imprime tudo sozinha!</p>
          </div>
        </div>

      </div>
    </div>
  );
}

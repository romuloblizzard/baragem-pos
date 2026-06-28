import React, { useState, useEffect, useRef } from 'react';
import { supabaseAdmin as supabase } from '../services/supabase-admin';
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
        // 1. Verifica se há COMPROVANTES pendentes (comandas pagas)
        const { data: receiptData, error: receiptError } = await supabase
          .from('orders')
          .select('*, items:order_items(*, products(name))')
          .eq('status', 'paid')
          .eq('receipt_printed', false)
          .order('closed_at', { ascending: true })
          .limit(1);

        if (receiptError) throw receiptError;

        if (receiptData && receiptData.length > 0) {
          const order = receiptData[0];
          isPrintingRef.current = true;
          setIsPrinting(true);
          setStatus(`Imprimindo Comprovante: Pulseira ${order.pulseira}...`);
          addLog(`🧾 Novo comprovante: Pulseira ${order.pulseira}`, 'info');

          // Dispara impressão
          await printItem({ type: 'receipt', data: order });

          // Marca como impresso no banco
          const { error: updateError } = await supabase
            .from('orders')
            .update({ receipt_printed: true })
            .eq('id', order.id);

          if (updateError) throw updateError;

          setTotalPrinted(prev => prev + 1);
          addLog(`✅ Comprovante #${order.id} impresso com sucesso!`, 'success');
          setStatus('Monitorando novos pedidos...');
          
          isPrintingRef.current = false;
          setIsPrinting(false);
          return; // Para não buscar tickets na mesma passada
        }

        // 2. Verifica se há CONFERÊNCIAS DE COMANDA pendentes (solicitadas pelo garçom)
        const { data: confData, error: confError } = await supabase
          .from('orders')
          .select('*, items:order_items(*, products(name))')
          .eq('conference_print_requested', true)
          .order('created_at', { ascending: true })
          .limit(1);

        if (confError) throw confError;

        if (confData && confData.length > 0) {
          const order = confData[0];
          isPrintingRef.current = true;
          setIsPrinting(true);
          setStatus(`Imprimindo Conferência: Pulseira ${order.pulseira}...`);
          addLog(`📄 Conferência solicitada: Pulseira ${order.pulseira}`, 'info');

          // Dispara impressão da conferência
          await printItem({ type: 'conference', data: order });

          // Reseta o campo no banco para não reimprimir
          const { error: confUpdateError } = await supabase
            .from('orders')
            .update({ conference_print_requested: false })
            .eq('id', order.id);

          if (confUpdateError) throw confUpdateError;

          setTotalPrinted(prev => prev + 1);
          addLog(`✅ Conferência #${order.id} impressa com sucesso!`, 'success');
          setStatus('Monitorando novos pedidos...');
          
          isPrintingRef.current = false;
          setIsPrinting(false);
          return;
        }

        // 2. Verifica se há TICKETS DE PRODUÇÃO pendentes
        const { data, error } = await supabase
          .from('order_items')
          .select(`
              id,
              quantity,
              notes,
              created_at,
              attendant_name,
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
          addLog(`📋 Novo ticket: ${parseFloat(item.quantity)}x ${(item.products as any)?.name} - Pulseira ${(item.orders as any)?.pulseira}`, 'info');

          // Dispara impressão
          await printItem({ type: 'ticket', data: item });

          // Marca como impresso no banco
          const { error: updateError } = await supabase
            .from('order_items')
            .update({ printed: true })
            .eq('id', item.id);

          if (updateError) throw updateError;

          setTotalPrinted(prev => prev + 1);
          addLog(`✅ Ticket #${item.id} impresso com sucesso!`, 'success');
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

  const printItem = (payload: any): Promise<void> => {
    return new Promise<void>((resolve) => {
      setActiveItemToPrint(payload);

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
            color: #000 !important;
            font-weight: 800 !important;
            -webkit-print-color-adjust: exact !important;
          }
          #print-section {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 76mm !important;
            margin: 0 !important;
            padding: 4px !important;
            display: block !important;
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
      {activeItemToPrint?.type === 'ticket' && (
        <div id="print-section" style={{ display: 'none' }}>
          <div className="c-center c-header c-bold">
            BARAGEM<br/>TICKET DE PRODUÇÃO
          </div>

          <div className="c-center">
            <div style={{ fontSize: '11px', marginBottom: '2px' }}>PULSEIRA / COMANDA:</div>
            <div className="c-pulseira">#{activeItemToPrint.data.orders?.pulseira || '0000'}</div>
            {activeItemToPrint.data.orders?.customer_name && (
              <div className="c-bold" style={{ marginTop: '4px' }}>
                {activeItemToPrint.data.orders.customer_name}
              </div>
            )}
            <div style={{ fontSize: '12px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '900', borderTop: '1px dashed #000', paddingTop: '4px' }}>
              ATENDENTE: {activeItemToPrint.data.attendant_name || 'Desconhecido'}
            </div>
          </div>

          <div className="c-item c-center">
            {parseFloat(activeItemToPrint.data.quantity)}x {activeItemToPrint.data.products?.name}
          </div>

          {activeItemToPrint.data.notes && (
            <div className="c-notes">
              OBS: {activeItemToPrint.data.notes}
            </div>
          )}

          {activeItemToPrint.data.products?.categories?.name && (
            <div className="c-section">
              Setor: <strong>{activeItemToPrint.data.products.categories.name}</strong>
            </div>
          )}

          <div className="c-section c-center">
            {new Date(activeItemToPrint.data.created_at || Date.now()).toLocaleDateString('pt-BR')} -{' '}
            {new Date(activeItemToPrint.data.created_at || Date.now()).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      )}

      {activeItemToPrint?.type === 'receipt' && (
        <div id="print-section" style={{ display: 'none' }}>
          <div className="c-center c-header c-bold" style={{ fontSize: '18px' }}>
            BARAGEM
          </div>
          <div className="c-center" style={{ fontSize: '11px', marginBottom: '8px' }}>
            Comprovante de Consumo<br/>
            {new Date(activeItemToPrint.data.closed_at || Date.now()).toLocaleString('pt-BR')}
          </div>

          <div className="c-section" style={{ marginBottom: '8px' }}>
            <strong>Pulseira:</strong> {activeItemToPrint.data.pulseira || '0000'}<br/>
            <strong>Cliente:</strong> {activeItemToPrint.data.customer_name || 'Nao identificado'}<br/>
            <strong>Atendente:</strong> {activeItemToPrint.data.attendant_name || 'Desconhecido'}
          </div>

          <table style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}>
            <tbody>
              {activeItemToPrint.data.items?.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ padding: '2px 0' }}>{parseFloat(item.quantity)}x</td>
                  <td style={{ padding: '2px 0' }}>
                    {item.products?.name}
                    {item.attendant_name ? ` (${item.attendant_name.trim().split(' ')[0]})` : ''}
                  </td>
                  <td style={{ textAlign: 'right', padding: '2px 0' }}>
                    R$ {(item.quantity * item.price_at_time).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="c-section" style={{ paddingTop: '8px', borderTop: '1px dashed #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL PAGO</span>
              <span>
                R$ {activeItemToPrint.data.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.price_at_time), 0).toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          <div className="c-center" style={{ marginTop: '16px', fontSize: '11px' }}>
            Obrigado pela preferência!
          </div>
        </div>
      )}

      {activeItemToPrint?.type === 'conference' && (() => {
        const items = activeItemToPrint.data.items || [];
        const subtotal = items.reduce((s: number, i: any) => s + (i.quantity * i.price_at_time), 0);
        return (
          <div id="print-section" style={{ display: 'none' }}>
            <div className="c-center c-header c-bold" style={{ fontSize: '18px' }}>
              BARAGEM
            </div>
            <div className="c-center" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Conferência de Comanda<br/>
              {new Date().toLocaleString('pt-BR')}
            </div>

            <div className="c-section" style={{ marginBottom: '8px' }}>
              <strong>Pulseira:</strong> {activeItemToPrint.data.pulseira || '0000'}<br/>
              <strong>Cliente:</strong> {activeItemToPrint.data.customer_name || 'Nao identificado'}<br/>
              <strong>Atendente:</strong> {activeItemToPrint.data.attendant_name || 'Desconhecido'}
            </div>

            <table style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ padding: '2px 0' }}>{parseFloat(item.quantity)}x</td>
                    <td style={{ padding: '2px 0' }}>
                      {item.products?.name}
                      {item.attendant_name ? ` (${item.attendant_name.trim().split(' ')[0]})` : ''}
                    </td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>
                      R$ {(item.quantity * item.price_at_time).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="c-section" style={{ paddingTop: '8px', borderTop: '1px dashed #000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="c-center" style={{ marginTop: '16px', fontSize: '10px', fontStyle: 'italic' }}>
              ** CONFERÊNCIA — não é comprovante de pagamento **
            </div>
          </div>
        );
      })()}

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

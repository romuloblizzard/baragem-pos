import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, DollarSign,
  Plus, Search, Edit, Trash2, CheckCircle, XCircle, ClipboardList, List, Home, Settings as SettingsIcon, Printer, Users, ShoppingCart
} from 'lucide-react';

export default function Manager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalRevenue: 0, openOrdersCount: 0, paidOrdersCount: 0 });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [period]);

  const loadStats = async () => {
    try {
      const data = await api.getStats(period);
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors" title="Voltar ao Início">
            <Home size={20} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <span className="text-xl">🍻</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">Baragem POS</h1>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mr-4 pr-4 md:mr-0 md:pr-0">
          {[
            { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
            { id: 'history', label: 'Histórico', icon: ClipboardList },
            { id: 'team', label: 'Equipe', icon: Users },
            { id: 'products', label: 'Produtos', icon: ShoppingBag },
            { id: 'categories', label: 'Categorias', icon: List },
            { id: 'stock', label: 'Estoque', icon: Package },
            { id: 'purchases', label: 'Compras', icon: ShoppingCart },
            { id: 'cashier', label: 'Caixa', icon: DollarSign },
            { id: 'settings', label: 'Configurações', icon: SettingsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard stats={stats} period={period} setPeriod={setPeriod} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'team' && <Team />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'categories' && <Categories />}
        {activeTab === 'stock' && <Stock />}
        {activeTab === 'purchases' && <Purchases />}
        {activeTab === 'cashier' && <Cashier stats={stats} />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => api.getCategories().then(setCategories);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      id: editingCategory?.id,
      name: formData.get('name'),
    };
    try {
      await api.saveCategory(data);
      setIsModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      alert('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza? Isso pode falhar se houver produtos nesta categoria.')) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert('Não foi possível excluir. Verifique se há produtos vinculados.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
        <button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden max-w-2xl overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[500px]">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{cat.name}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input name="name" defaultValue={editingCategory?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ stats, period, setPeriod }: { stats: any, period: 'daily' | 'weekly' | 'monthly' | 'yearly', setPeriod: (p: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any>(null);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [coverFee, setCoverFee] = useState(0);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => api.getOrders('open').then(setOrders);

  const toggleOrderSelection = (order: any) => {
    if (selectedOrders.find(o => o.id === order.id)) {
      setSelectedOrders(selectedOrders.filter(o => o.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  const handleCloseOrders = async (method: string) => {
    const ordersToClose = selectedOrders.length > 0 ? selectedOrders : (viewDetailsOrder ? [viewDetailsOrder] : []);

    try {
      const subtotal = ordersToClose.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0);
      const serviceValue = includeServiceFee ? subtotal * 0.1 : 0;

      for (const order of ordersToClose) {
        const orderSubtotal = order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
        const proportion = subtotal > 0 ? orderSubtotal / subtotal : 0;
        const orderFees = (serviceValue + coverFee) * proportion;
        const orderTotalToPay = orderSubtotal + orderFees;

        await api.payOrder(order.id, orderTotalToPay, method);
      }
      alert(`${ordersToClose.length} pedido(s) fechado(s) com sucesso!`);
      setIsPaymentModalOpen(false);
      setSelectedOrders([]);
      setViewDetailsOrder(null);
      setIncludeServiceFee(true);
      setCoverFee(0);
      loadOrders();
    } catch (err) {
      alert('Erro ao fechar pedidos');
    }
  };

  const totalSelected = selectedOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0);
  }, 0);

  const totalViewDetails = viewDetailsOrder?.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0) || 0;

  const averageTicket = stats.paidOrdersCount > 0 ? stats.totalRevenue / stats.paidOrdersCount : 0;

  const periodLabels = {
    daily: 'Hoje',
    weekly: '7 Dias',
    monthly: 'Mês',
    yearly: 'Ano'
  };

  return (
    <div className="space-y-6">
      {/* PERIOD FILTERS */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 self-start max-w-md mb-6">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${period === p
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title={`Vendas (${periodLabels[period]})`} value={`R$ ${stats.totalRevenue?.toFixed(2) || '0.00'}`} icon={DollarSign} color="emerald" />
        <StatCard title="Ticket Médio" value={`R$ ${averageTicket.toFixed(2)}`} icon={DollarSign} color="purple" />
        <StatCard title="Comandas Pagas" value={stats.paidOrdersCount || 0} icon={CheckCircle} color="blue" />
        <StatCard title="Comandas Abertas" value={stats.openOrdersCount || 0} icon={ClipboardList} color="orange" />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="text-blue-400" />
            Pedidos em Aberto
          </h2>
          {selectedOrders.length > 0 && (
            <button
              onClick={() => {
                setIncludeServiceFee(true);
                setCoverFee(0);
                setIsPaymentModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm animate-in fade-in"
            >
              Pagar Selecionados (R$ {totalSelected.toFixed(2)})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const isSelected = selectedOrders.find(o => o.id === order.id);
            return (
              <div
                key={order.id}
                className={`relative bg-slate-800/50 border p-4 rounded-xl transition-all cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 hover:border-blue-500/50'
                  }`}
                onClick={() => setViewDetailsOrder(order)}
              >
                <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => toggleOrderSelection(order)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-start mb-2 pr-8">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                    #{order.pulseira}
                  </span>
                  <span className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleTimeString().slice(0, 5)}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-200">{order.customer_name}</h3>
                {order.customer_phone && <p className="text-xs text-blue-400">📞 {order.customer_phone}</p>}

                <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                  <span className="text-sm text-slate-400">{order.items.length} itens</span>
                  <span className="font-bold text-emerald-400">
                    R$ {order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Nenhum pedido aberto no momento.
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Pedido #{viewDetailsOrder.pulseira}</h3>
                <p className="text-slate-400">{viewDetailsOrder.customer_name}</p>
                {viewDetailsOrder.customer_phone && (
                  <p className="text-xs text-blue-400 mt-1">📞 {viewDetailsOrder.customer_phone}</p>
                )}
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="text-slate-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {viewDetailsOrder.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-200">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.quantity}x R$ {item.price_at_time.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-slate-300">
                    R$ {(item.quantity * item.price_at_time).toFixed(2)}
                  </p>
                </div>
              ))}
              {viewDetailsOrder.items.length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhum item neste pedido.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-2xl font-bold text-emerald-400">
                  R$ {totalViewDetails.toFixed(2)}
                </span>
              </div>

              {isPaymentModalOpen && (
                <div className="space-y-3 mb-4 border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeServiceFee}
                        onChange={(e) => setIncludeServiceFee(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      Taxa de Serviço (10%)
                    </label>
                    <span className="text-slate-200 font-medium">
                      R$ {(includeServiceFee ? totalViewDetails * 0.1 : 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Couvert Artístico</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={coverFee}
                        onChange={(e) => setCoverFee(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <span className="text-slate-400">Total Geral</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      R$ {(totalViewDetails + (includeServiceFee ? totalViewDetails * 0.1 : 0) + coverFee).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {!isPaymentModalOpen ? (
                <button
                  onClick={() => {
                    setIncludeServiceFee(true);
                    setCoverFee(0);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Fechar Conta / Pagar
                </button>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <p className="text-center text-sm text-slate-400 mb-2">Selecione o método de pagamento:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleCloseOrders('cash')} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">Dinheiro</button>
                    <button onClick={() => handleCloseOrders('card')} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">Cartão</button>
                    <button onClick={() => handleCloseOrders('pix')} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">PIX</button>
                  </div>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="w-full text-slate-500 text-sm hover:text-white py-2">Cancelar Pagamento</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi Payment Modal (only if opened from selection) */}
      {isPaymentModalOpen && !viewDetailsOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Pagamento Unificado</h3>
            <p className="text-slate-400 mb-2">
              Fechando {selectedOrders.length} pedidos.
            </p>
            <p className="text-2xl font-bold text-emerald-400 mb-6">
              Subtotal: R$ {totalSelected.toFixed(2)}
            </p>

            <div className="space-y-3 mb-6 border-t border-slate-800 pt-3">
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={(e) => setIncludeServiceFee(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  Taxa de Serviço (10%)
                </label>
                <span className="text-slate-200 font-medium">
                  R$ {(includeServiceFee ? totalSelected * 0.1 : 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Couvert Artístico</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={coverFee}
                    onChange={(e) => setCoverFee(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <span className="text-slate-400">Total Geral</span>
                <span className="text-2xl font-bold text-emerald-400">
                  R$ {(totalSelected + (includeServiceFee ? totalSelected * 0.1 : 0) + coverFee).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleCloseOrders('cash')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">Dinheiro</button>
              <button onClick={() => handleCloseOrders('card')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">Cartão</button>
              <button onClick={() => handleCloseOrders('pix')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">PIX</button>
            </div>
            <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function History() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = orders.filter(order =>
      order.customer_name?.toLowerCase().includes(lowerTerm) ||
      order.pulseira?.toLowerCase().includes(lowerTerm) ||
      order.items?.some((item: any) => item.product_name?.toLowerCase().includes(lowerTerm))
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders('paid');
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const totalViewDetails = viewDetailsOrder?.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="text-blue-400" />
          Histórico de Pedidos
        </h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, comanda ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
          />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => setViewDetailsOrder(order)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">
                  #{order.pulseira}
                </span>
                <span className="text-slate-400 text-xs text-right">
                  {new Date(order.closed_at || order.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-200">{order.customer_name}</h3>
              {order.customer_phone && <p className="text-xs text-blue-400">📞 {order.customer_phone}</p>}

              <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${order.status === 'paid' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  Pago
                </span>
                <span className="font-bold text-emerald-400">
                  R$ {order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              {searchTerm ? 'Nenhum pedido encontrado para esta busca.' : 'Nenhum pedido fechado ainda.'}
            </div>
          )}
        </div>
      </div>

      {/* Reused Order Details Modal for view only */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Pedido #{viewDetailsOrder.pulseira}</h3>
                <p className="text-slate-400">{viewDetailsOrder.customer_name}</p>
                <p className="text-xs text-slate-500 mt-1">Fechado em: {new Date(viewDetailsOrder.closed_at || viewDetailsOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="text-slate-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {viewDetailsOrder.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-200">{item.product_name || `Produto #${item.product_id}`}</p>
                    <p className="text-xs text-slate-500">{item.quantity}x R$ {item.price_at_time?.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-slate-300">
                    R$ {(item.quantity * item.price_at_time).toFixed(2)}
                  </p>
                </div>
              ))}
              {viewDetailsOrder.items.length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhum item neste pedido.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-4 text-lg">
                <span className="text-slate-400">Total Pago</span>
                <span className="font-bold text-emerald-400">
                  R$ {totalViewDetails.toFixed(2)}
                </span>
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Team() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // Auto-generate a random 6 digit PIN if not provided
    let pin = formData.get('pin') as string;
    if (!pin) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const data = {
      id: editingEmployee?.id,
      name: formData.get('name'),
      role: formData.get('role'),
      pin: pin,
      active: formData.get('active') === 'true',
    };

    try {
      await api.saveEmployee(data);
      setIsModalOpen(false);
      setEditingEmployee(null);
      loadEmployees();
      alert(`Funcionário salvo com sucesso!\nO PIN de acesso é: ${pin}\n(Anote este PIN e entregue ao funcionário)`);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('unique constraint')) {
        alert('Este PIN já está em uso por outro funcionário. Tente outro.');
      } else {
        alert('Erro ao salvar funcionário.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este funcionário?')) return;
    try {
      await api.deleteEmployee(id);
      loadEmployees();
    } catch (err) {
      alert('Não foi possível excluir o funcionário.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-blue-400" /> Gerenciar Equipe
        </h2>
        <button
          onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[500px]">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Pino de Acesso</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{emp.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${emp.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {emp.role === 'admin' ? 'Gerência' : 'Garçom'}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-slate-400 tracking-widest">{emp.pin}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-xs font-bold ${emp.active ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${emp.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {emp.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum funcionário cadastrado. Utilize o script SQL para adicionar o Admin Padrão.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input name="name" defaultValue={editingEmployee?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cargo</label>
                <select name="role" defaultValue={editingEmployee?.role || 'waiter'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200">
                  <option value="waiter">Garçom (Modo Atendimento Vendas)</option>
                  <option value="admin">Gerente (Acesso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">PIN (Deixe vazio para gerar sozinho)</label>
                <input name="pin" defaultValue={editingEmployee?.pin} minLength={6} maxLength={6} pattern="\d{6}" placeholder="Ex: 123456" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status de Acesso</label>
                <select name="active" defaultValue={editingEmployee?.active !== false ? 'true' : 'false'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200">
                  <option value="true">Conta Ativa (Pode logar)</option>
                  <option value="false">Conta Bloqueada</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [historyProduct, setHistoryProduct] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  // Form State
  const [productType, setProductType] = useState('simple');
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [childProducts, setChildProducts] = useState<number[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setProductType(editingProduct.type || 'simple');
      setIngredients(editingProduct.ingredients || []);
      setChildProducts(products.filter(p => p.parent_id === editingProduct.id).map(p => p.id));
    } else {
      setProductType('simple');
      setIngredients([]);
      setChildProducts([]);
    }
  }, [editingProduct, products]);

  const loadProducts = () => api.getProducts().then(setProducts);
  const loadCategories = () => api.getCategories().then(setCategories);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const data: any = {
      id: editingProduct?.id,
      name: formData.get('name'),
      image_url: formData.get('image_url'),
      observation: formData.get('observation'),
      category_id: parseInt(formData.get('category_id') as string),
      active: true,
      type: productType,
    };

    // Include parent_id if it exists (for variations)
    if (editingProduct?.parent_id) {
      data.parent_id = editingProduct.parent_id;
    }

    if (productType === 'simple' || productType === 'composition') {
      data.price = parseFloat(formData.get('price') as string);
      data.cost_price = parseFloat(formData.get('cost_price') as string);
    } else {
      data.price = 0; // Default price for variable parent
      data.cost_price = 0;
    }

    if (productType === 'simple') {
      data.stock = parseFloat(formData.get('stock') as string);
      data.unit = formData.get('unit');
      data.purchase_unit = formData.get('purchase_unit') || null;
      data.unit_conversion_factor = parseFloat(formData.get('unit_conversion_factor') as string) || 1;
    } else {
      data.stock = 0; // Default stock for variable/composition
      data.unit = 'un';
      data.unit_conversion_factor = 1;
    }

    if (productType === 'composition') {
      data.ingredients = ingredients;
    }

    if (productType === 'variable') {
      data.child_product_ids = childProducts.filter(id => id && !isNaN(id));
    }

    try {
      await api.saveProduct(data);
      setIsModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Deseja realmente remover este produto? (Isso não apagará do histórico de vendas)')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert('Não foi possível excluir o produto.');
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient_id: '', quantity: 1 }]);
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addChildProduct = () => {
    setChildProducts([...childProducts, 0]);
  };

  const updateChildProduct = (index: number, value: number) => {
    const newChildren = [...childProducts];
    newChildren[index] = value;
    setChildProducts(newChildren);
  };

  const removeChildProduct = (index: number) => {
    setChildProducts(childProducts.filter((_, i) => i !== index));
  };

  const loadHistory = async (product: any) => {
    try {
      const hist = await api.getProductPurchaseHistory(product.id);
      setPurchaseHistory(hist);
      setHistoryProduct(product);
    } catch (err) {
      alert('Erro ao carregar histórico');
    }
  };

  // Helper to get simple products for ingredients selection
  const simpleProducts = products.filter(p => p.type === 'simple' && p.id !== editingProduct?.id);

  // Helper to get parent products for variations (if we were implementing that here, but for now we just create the parent)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Preço</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.filter(p => !p.parent_id).map(product => (
              <React.Fragment key={product.id}>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    {product.name}
                    {product.type === 'variable' && (
                      <div className="text-xs text-slate-500 mt-1">
                        {products.filter(p => p.parent_id === product.id).length} variações
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${product.type === 'variable' ? 'bg-purple-500/20 text-purple-400' :
                      product.type === 'composition' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                      {product.type === 'simple' ? 'Simples' : product.type === 'variable' ? 'Variável' : 'Composição'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                      {product.category_name || 'Sem categoria'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">
                    {product.type === 'variable' ? '-' : `R$ ${product.price?.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4">
                    {product.type === 'variable' ? (
                      <span className="text-slate-500">-</span>
                    ) : product.type === 'composition' ? (
                      <span className="text-slate-500">Calc.</span>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {product.stock} {product.unit}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {product.type === 'variable' && (
                      <button
                        onClick={() => {
                          // Open modal to add variation (which is a product with parent_id = product.id)
                          setEditingProduct({ parent_id: product.id, type: 'simple', category_id: product.category_id });
                          setIsModalOpen(true);
                        }}
                        className="text-purple-400 hover:text-purple-300 p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                        title="Adicionar Variação"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => loadHistory(product)}
                      className="text-amber-400 hover:text-amber-300 p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Histórico de Compras"
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button
                      onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir Produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
                {/* Render Variations */}
                {products.filter(p => p.parent_id === product.id).map(variation => (
                  <tr key={variation.id} className="bg-slate-900/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 pl-12 font-medium text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                      {variation.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${variation.type === 'composition' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                        }`}>
                        {variation.type === 'simple' ? 'Simples' : 'Composição'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">Variação</td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">R$ {variation.price?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {variation.type === 'composition' ? (
                        <span className="text-slate-500">Calc.</span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${variation.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                          {variation.stock} {variation.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => loadHistory(variation)}
                        className="text-amber-400 hover:text-amber-300 p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Histórico de Compras"
                      >
                        <ClipboardList size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingProduct(variation); setIsModalOpen(true); }}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(variation.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Variação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct?.id ? 'Editar Produto' : editingProduct?.parent_id ? 'Nova Variação' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">

              {/* Type Selection - Only for new root products */}
              {!editingProduct?.id && !editingProduct?.parent_id && (
                <div className="flex gap-4 mb-4">
                  {['simple', 'variable', 'composition'].map(type => (
                    <label key={type} className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${productType === type
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}>
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={productType === type}
                        onChange={(e) => setProductType(e.target.value)}
                        className="hidden"
                      />
                      <span className="font-bold uppercase text-xs">{type === 'simple' ? 'Simples' : type === 'variable' ? 'Variável' : 'Composição'}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Type Selection - For Variations (can be Simple or Composition) */}
              {editingProduct?.parent_id && !editingProduct?.id && (
                <div className="flex gap-4 mb-4">
                  {['simple', 'composition'].map(type => (
                    <label key={type} className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${productType === type
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}>
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={productType === type}
                        onChange={(e) => setProductType(e.target.value)}
                        className="hidden"
                      />
                      <span className="font-bold uppercase text-xs">{type === 'simple' ? 'Simples' : 'Composição'}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">URL da Imagem</label>
                <input name="image_url" defaultValue={editingProduct?.image_url} placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Observação</label>
                <textarea name="observation" defaultValue={editingProduct?.observation} rows={2} placeholder="Detalhes opcionais do produto..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
              </div>

              {productType !== 'variable' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Preço Venda (R$)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Preço Custo (R$)</label>
                    <input name="cost_price" type="number" step="0.01" defaultValue={editingProduct?.cost_price} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  {productType === 'simple' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Estoque</label>
                        <input name="stock" type="number" step="0.001" defaultValue={editingProduct?.stock} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Unidade</label>
                        <select name="unit" defaultValue={editingProduct?.unit || 'un'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="un">Unidade (un)</option>
                          <option value="ml">Mililitro (ml)</option>
                          <option value="l">Litro (l)</option>
                          <option value="kg">Quilograma (kg)</option>
                          <option value="g">Grama (g)</option>
                          <option value="dose">Dose</option>
                        </select>
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-3 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                        <div>
                          <label className="block text-xs font-medium text-blue-400 mb-1">Unidade na Compra (Opcional Geralmente)</label>
                          <input name="purchase_unit" defaultValue={editingProduct?.purchase_unit} placeholder="Ex: Garrafa, Caixa" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-400 mb-1">Equivale a (Fator de Conversão)</label>
                          <input name="unit_conversion_factor" type="number" step="0.001" defaultValue={editingProduct?.unit_conversion_factor || 1} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" title="Quantas unidades de venda vem em 1 unidade de compra? Ex: 1 Garrafa = 1000 ml" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                <select name="category_id" defaultValue={editingProduct?.category_id} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Ingredients Section for Composition */}
              {productType === 'composition' && (
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-400">Ingredientes / Composição</label>
                    <button type="button" onClick={addIngredient} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-blue-400">
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={ing.ingredient_id}
                          onChange={(e) => updateIngredient(index, 'ingredient_id', parseInt(e.target.value))}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="">Selecione um produto...</option>
                          {simpleProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.001"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                          placeholder="Qtd"
                        />
                        <button type="button" onClick={() => removeIngredient(index)} className="text-red-400 hover:bg-red-500/10 p-2 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {ingredients.length === 0 && (
                      <p className="text-xs text-slate-500 italic">Nenhum ingrediente adicionado.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Variations Section for Variable Product */}
              {productType === 'variable' && (
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-400">Produtos Filhos / Variações</label>
                    <button type="button" onClick={addChildProduct} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-purple-400">
                      + Adicionar Existente
                    </button>
                  </div>
                  <div className="space-y-2">
                    {childProducts.map((childId, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={childId || ''}
                          onChange={(e) => updateChildProduct(index, parseInt(e.target.value))}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="">Selecione um produto simples...</option>
                          {simpleProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => removeChildProduct(index)} className="text-red-400 hover:bg-red-500/10 p-2 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {childProducts.length === 0 && (
                      <p className="text-xs text-slate-500 italic">Nenhum produto vinculado ainda. Adicione produtos simples já cadastrados.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold">Histórico: {historyProduct.name}</h3>
              <button onClick={() => setHistoryProduct(null)} className="text-slate-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2">
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic">Nenhum registro de compra (conciliado) encontrado para este produto.</div>
              ) : (
                <div className="space-y-4">
                  {purchaseHistory.map((hist, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-200">{new Date(hist.date).toLocaleDateString()}</span>
                        <span className="text-emerald-400 font-bold">R$ {hist.unit_cost?.toFixed(2)} / un</span>
                      </div>
                      <div className="text-sm text-slate-400 grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="block text-xs uppercase text-slate-500">Fornecedor</span>
                          {hist.supplier_name}
                        </div>
                        <div>
                          <span className="block text-xs uppercase text-slate-500">Nota Fiscal</span>
                          {hist.invoice_number || '-'}
                        </div>
                        <div>
                          <span className="block text-xs uppercase text-slate-500">Qtd Comprada (reconciliada)</span>
                          {hist.quantity}
                        </div>
                        <div>
                          <span className="block text-xs uppercase text-slate-500">Nome na Nota</span>
                          {hist.raw_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stock() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  const updateStock = async (product: any, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    await api.saveProduct({ ...product, stock: newStock });
    api.getProducts().then(setProducts);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Controle de Estoque</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-200">{product.name}</h3>
              <span className="text-xs text-slate-500">{product.category}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => updateStock(product, -1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
              >-</button>
              <span className={`font-mono font-bold w-8 text-center ${product.stock <= 5 ? 'text-red-400' : 'text-slate-200'}`}>
                {product.stock}
              </span>
              <button
                onClick={() => updateStock(product, 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cashier({ stats }: { stats: any }) {
  const [cashierStatus, setCashierStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'open' | 'close'>('open');
  const [inputValue, setInputValue] = useState('');
  const [closedSessionData, setClosedSessionData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    loadStatus();
    loadSettings();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getCashierStatus();
      setCashierStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCashier = async () => {
    try {
      await api.openCashier(parseFloat(inputValue) || 0);
      setIsModalOpen(false);
      setInputValue('');
      loadStatus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseCashier = async () => {
    try {
      const res = await api.closeCashier(parseFloat(inputValue) || 0);
      setClosedSessionData(res.session);
      setIsModalOpen(false);
      setInputValue('');
      loadStatus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrintReceipt = () => {
    if (!closedSessionData) return;

    const session = closedSessionData;
    const date = new Date(session.closed_at).toLocaleString('pt-BR');
    const initial = session.initial_balance || 0;
    const sales = session.total_cash_sales || 0;
    const subtotal = initial + sales;
    const amortization = session.amortization || 0;
    const final = session.final_balance || 0;

    const content = `
      <div style="font-family: monospace; width: 300px; padding: 20px; font-size: 12px;">
        <h2 style="text-align: center; margin: 0;">FECHAMENTO DE CAIXA</h2>
        <p style="text-align: center; margin: 5px 0 20px 0;">${settings.establishment_name || 'Baragem POS'}</p>
        
        <p>Data: ${date}</p>
        <hr style="border-top: 1px dashed #000; margin: 10px 0;">
        
        <div style="display: flex; justify-content: space-between;">
          <span>Saldo Inicial (Fundo):</span>
          <span>R$ ${initial.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Vendas em Dinheiro:</span>
          <span>R$ ${sales.toFixed(2)}</span>
        </div>
        
        <hr style="border-top: 1px dashed #000; margin: 10px 0;">
        
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Subtotal:</span>
          <span>R$ ${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>(-) Amortização/Sangria:</span>
          <span>R$ ${amortization.toFixed(2)}</span>
        </div>
        
        <hr style="border-top: 1px dashed #000; margin: 10px 0;">
        
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
          <span>SALDO FINAL (Gaveta):</span>
          <span>R$ ${final.toFixed(2)}</span>
        </div>
        
        <br><br><br>
        <div style="text-align: center; border-top: 1px solid #000; width: 80%; margin: 0 auto;">
          <span style="font-size: 10px;">Assinatura do Responsável</span>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recibo de Fechamento</title>
          </head>
          <body onload="window.print(); window.close();">
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-500">Carregando status do caixa...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className={`p-6 rounded-2xl border ${cashierStatus?.status === 'open' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'} flex flex-col justify-between`}>
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-1">Status do Caixa</h2>
            <div className={`text-3xl font-bold ${cashierStatus?.status === 'open' ? 'text-emerald-400' : 'text-red-400'}`}>
              {cashierStatus?.status === 'open' ? 'ABERTO' : 'FECHADO'}
            </div>
            {cashierStatus?.status === 'open' && (
              <p className="text-slate-400 text-sm mt-2">
                Aberto em: {new Date(cashierStatus.session.opened_at).toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-6">
            {cashierStatus?.status === 'open' ? (
              <button
                onClick={() => { setModalType('close'); setIsModalOpen(true); }}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
              >
                Fechar Caixa
              </button>
            ) : (
              <button
                onClick={() => { setModalType('open'); setIsModalOpen(true); }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
              >
                Abrir Caixa
              </button>
            )}
          </div>
        </div>

        {/* Current Session Stats (if open) */}
        {cashierStatus?.status === 'open' && (
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2">Resumo da Sessão Atual</h3>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Saldo Inicial (Fundo)</span>
              <span className="font-mono font-bold text-slate-200">R$ {cashierStatus.session.initial_balance.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Vendas em Dinheiro</span>
              <span className="font-mono font-bold text-emerald-400">+ R$ {cashierStatus.session.current_cash_sales.toFixed(2)}</span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-200 font-bold">Total em Caixa (Estimado)</span>
              <span className="font-mono font-bold text-xl text-white">R$ {cashierStatus.session.current_balance.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Session / Receipt Print */}
      {closedSessionData && (
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-4">
          <div>
            <h3 className="font-bold text-blue-400">Caixa Fechado com Sucesso!</h3>
            <p className="text-sm text-slate-400">Saldo Final: R$ {closedSessionData.final_balance.toFixed(2)}</p>
          </div>
          <button
            onClick={handlePrintReceipt}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Printer size={18} /> Imprimir Recibo
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-white">
              {modalType === 'open' ? 'Abrir Caixa' : 'Fechar Caixa'}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {modalType === 'open' ? 'Valor de Fundo de Caixa (Troco Inicial)' : 'Valor de Amortização / Sangria'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              {modalType === 'close' && (
                <p className="text-xs text-slate-500 mt-2">
                  Informe o valor retirado do caixa para depósito ou pagamento de despesas.
                  O sistema calculará o saldo final subtraindo este valor do total em caixa.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modalType === 'open' ? handleOpenCashier : handleCloseCashier}
                className={`flex-1 ${modalType === 'open' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'} text-white py-3 rounded-xl font-bold transition-colors`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
      <div className={`p-3 rounded-xl bg-slate-950/50`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState({
    establishment_name: '',
    establishment_address: '',
    establishment_phone: '',
    establishment_cnpj: '',
    receipt_footer: 'Obrigado pela preferência!',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saveSettings(settings);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Configurações do Estabelecimento</h2>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Estabelecimento</label>
            <input
              name="establishment_name"
              value={settings.establishment_name}
              onChange={handleChange}
              placeholder="Ex: Bar do Zé"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Endereço</label>
            <input
              name="establishment_address"
              value={settings.establishment_address}
              onChange={handleChange}
              placeholder="Rua Exemplo, 123"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Telefone</label>
              <input
                name="establishment_phone"
                value={settings.establishment_phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">CNPJ (Opcional)</label>
              <input
                name="establishment_cnpj"
                value={settings.establishment_cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Rodapé da Comanda</label>
            <textarea
              name="receipt_footer"
              value={settings.receipt_footer}
              onChange={handleChange}
              rows={3}
              placeholder="Mensagem no final da comanda..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Purchases() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // To map to

  const [view, setView] = useState<'list' | 'new_order' | 'reconcile'>('list');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productCreationIndex, setProductCreationIndex] = useState<number | null>(null);

  const [reconcileItems, setReconcileItems] = useState<any[]>([]);
  const [newOrderItems, setNewOrderItems] = useState<any[]>([{ raw_name: '', raw_quantity: 1, raw_unit_price: 0 }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await api.getProducts();
      setProducts(p.filter(prod => prod.type === 'simple')); // Generally we buy simple products
      const s = await api.getSuppliers();
      setSuppliers(s);
      const o = await api.getPurchaseOrders();
      setOrders(o);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      id: editingOrder?.id,
      supplier_id: formData.get('supplier_id') ? parseInt(formData.get('supplier_id') as string) : null,
      invoice_number: formData.get('invoice_number'),
      total_amount: parseFloat(formData.get('total_amount') as string) || 0,
      freight_amount: parseFloat(formData.get('freight_amount') as string) || 0,
      notes: formData.get('notes')
    };
    try {
      await api.savePurchaseOrder(data, newOrderItems);
      setView('list');
      setEditingOrder(null);
      setNewOrderItems([{ raw_name: '', raw_quantity: 1, raw_unit_price: 0 }]);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar pedido: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await api.saveSupplier({
        id: editingSupplier?.id,
        name: formData.get('name') as string,
        document: formData.get('document') as string,
        phone: formData.get('phone') as string,
      });
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar fornecedor: ' + err.message);
    }
  };

  const handleSaveQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      const newProduct = await api.saveProduct({
        name: formData.get('name'),
        unit: formData.get('unit'),
        type: 'simple',
        category_id: null,
        stock: 0,
        cost_price: 0,
        price: parseFloat(formData.get('sell_price') as string) || 0
      });

      // Update local products list
      await loadData();

      // Link the new product to the item being reconciled
      if (productCreationIndex !== null) {
        const newItems = [...reconcileItems];
        newItems[productCreationIndex].product_id = newProduct.id;
        setReconcileItems(newItems);
      }

      setIsProductModalOpen(false);
      setProductCreationIndex(null);
    } catch (err: any) {
      alert('Erro ao criar produto: ' + err.message);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    try {
      await api.deleteSupplier(id);
      loadData();
    } catch (err) {
      alert('Não é possível excluir fornecedor logado a pedidos.');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    try {
      await api.deletePurchaseOrder(id);
      loadData();
    } catch (err) {
      alert('Erro ao excluir pedido');
    }
  };

  const startReconciliation = (order: any) => {
    setEditingOrder(order);

    // Calculate total value to distribute freight
    const totalItemsValue = order.items.reduce((acc: number, item: any) => acc + (item.raw_quantity * item.raw_unit_price), 0);
    const freightAmount = parseFloat(order.freight_amount) || 0;

    // Prepare items for reconciliation state
    setReconcileItems(order.items.map((item: any) => {
      const itemRawValue = item.raw_quantity * item.raw_unit_price;
      const proportion = totalItemsValue > 0 ? (itemRawValue / totalItemsValue) : 0;
      const freightShare = proportion * freightAmount;
      const totalItemCost = itemRawValue + freightShare;
      const unitCostWithFreight = item.raw_quantity > 0 ? (totalItemCost / item.raw_quantity) : 0;

      return {
        ...item,
        product_id: '',
        reconciled_quantity: item.raw_quantity,
        reconciled_unit_cost: unitCostWithFreight
      };
    }));
    setView('reconcile');
  };

  const handleReconcile = async () => {
    if (!confirm('Confirmar conciliação? Isso atualizará o estoque e preços de custo.')) return;
    try {
      await api.reconcilePurchaseOrder(editingOrder.id, reconcileItems);
      setView('list');
      setEditingOrder(null);
      loadData();
    } catch (err) {
      alert('Erro ao conciliar pedido');
    }
  };

  if (view === 'new_order') {
    // calculate sum of items automatically to show the user
    const itemsTotal = newOrderItems.reduce((acc, item) => acc + ((item.raw_quantity || 0) * (item.raw_unit_price || 0)), 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingOrder ? 'Editar Pedido' : 'Novo Pedido de Compra'}</h2>
          <button onClick={() => { setView('list'); setEditingOrder(null); }} className="text-slate-400 hover:text-white">Voltar</button>
        </div>
        <form onSubmit={handleCreateOrder} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fornecedor</label>
              <select name="supplier_id" defaultValue={editingOrder?.supplier_id || ''} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2">
                <option value="">Sem fornecedor / Avulso</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nota Fiscal N.º</label>
              <input name="invoice_number" defaultValue={editingOrder?.invoice_number} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Valor Total dos Produtos</label>
              <input type="number" step="0.01" name="total_amount" value={itemsTotal.toFixed(2)} readOnly className="w-full bg-slate-800/50 border-slate-700 rounded-lg p-2 text-slate-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Valor do Frete (R$)</label>
              <input type="number" step="0.01" name="freight_amount" defaultValue={editingOrder?.freight_amount || 0} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Observações</label>
              <input name="notes" defaultValue={editingOrder?.notes} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Itens da Nota (Cru)</h3>
            <p className="text-xs text-slate-400 mb-4">Adicione os itens conforme vieram escritos na nota fiscal.</p>
            {newOrderItems.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center flex-wrap sm:flex-nowrap">
                <input
                  placeholder="Nome exato na nota" required
                  value={item.raw_name}
                  onChange={(e) => {
                    const newItems = [...newOrderItems];
                    newItems[index].raw_name = e.target.value;
                    setNewOrderItems(newItems);
                  }}
                  className="flex-1 bg-slate-800 border-slate-700 rounded-lg p-2" />
                <input
                  type="number" step="1" placeholder="Qtd" required title="Quantidade Inteira (ex: 2)"
                  value={item.raw_quantity}
                  onChange={(e) => {
                    const newItems = [...newOrderItems];
                    newItems[index].raw_quantity = parseInt(e.target.value) || 0;
                    setNewOrderItems(newItems);
                  }}
                  className="w-24 bg-slate-800 border-slate-700 rounded-lg p-2" />
                <input
                  type="number" step="0.01" placeholder="Custo Un." required title="Valor Unitário de Custo"
                  value={item.raw_unit_price}
                  onChange={(e) => {
                    const newItems = [...newOrderItems];
                    newItems[index].raw_unit_price = parseFloat(e.target.value) || 0;
                    setNewOrderItems(newItems);
                  }}
                  className="w-28 bg-slate-800 border-slate-700 rounded-lg p-2" />

                <div className="w-32 bg-slate-800/50 border-slate-700 rounded-lg p-2 text-slate-300 text-sm flex items-center justify-end font-mono">
                  R$ {((item.raw_quantity || 0) * (item.raw_unit_price || 0)).toFixed(2)}
                </div>

                <button type="button" onClick={() => setNewOrderItems(newOrderItems.filter((_, i) => i !== index))} className="text-red-400 p-2"><Trash2 size={16} /></button>
              </div>
            ))}

            <div className="flex justify-between items-center mt-2">
              <button type="button" onClick={() => setNewOrderItems([...newOrderItems, { raw_name: '', raw_quantity: 1, raw_unit_price: 0 }])} className="text-blue-400 text-sm font-bold">+ Adicionar Linha</button>
              <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span>Soma Parcial: </span>
                <span className="text-emerald-400">
                  R$ {itemsTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold">Salvar Pedido</button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'reconcile' && editingOrder) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Conciliar Pedido #{editingOrder.id}</h2>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-white">Cancelar</button>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl space-y-4">
          <p className="text-sm text-slate-400 mb-4">Mapeie cada item da nota para um produto do sistema e informe qual foi a quantidade equivalente que será dada de entrada no estoque.</p>

          {(editingOrder.freight_amount > 0) && (
            <div className="mb-4 bg-orange-500/20 text-orange-400 p-3 rounded-xl text-sm font-medium border border-orange-500/30">
              Custo de frete rateado: O valor do frete (R$ {editingOrder.freight_amount?.toFixed(2)}) será distribuído proporcionalmente no custo de cada produto.
            </div>
          )}

          {reconcileItems.map((item, index) => (
            <div key={item.id} className="border border-slate-800 p-4 rounded-xl mb-4 bg-slate-950/50">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-xs text-slate-500 uppercase">Item na Nota</label>
                  <p className="font-bold">{item.raw_name}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase">Veio na Nota</label>
                  <p>{item.raw_quantity} un x R$ {item.raw_unit_price} = R$ {(item.raw_quantity * item.raw_unit_price).toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm text-emerald-400">Produto no Sistema</label>
                    <button
                      onClick={() => {
                        setProductCreationIndex(index);
                        setIsProductModalOpen(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      + Novo
                    </button>
                  </div>
                  <select
                    value={item.product_id}
                    onChange={(e) => {
                      const newItems = [...reconcileItems];
                      const newId = parseInt(e.target.value) || '';
                      newItems[index].product_id = newId;

                      const selectedProduct = products.find(p => p.id === newId);
                      let newQty = item.raw_quantity || 0;
                      if (selectedProduct && selectedProduct.unit_conversion_factor) {
                        const factor = parseFloat(selectedProduct.unit_conversion_factor);
                        if (factor > 0) newQty = newQty * factor;
                      }

                      newItems[index].reconciled_quantity = newQty;

                      if (newQty > 0) {
                        const totalItemsValue = reconcileItems.reduce((acc, i) => acc + (i.raw_quantity * i.raw_unit_price), 0);
                        const freightAmount = parseFloat(editingOrder.freight_amount) || 0;
                        const itemRawValue = item.raw_quantity * item.raw_unit_price;
                        const proportion = totalItemsValue > 0 ? (itemRawValue / totalItemsValue) : 0;
                        const freightShare = proportion * freightAmount;
                        const totalItemCost = itemRawValue + freightShare;

                        newItems[index].reconciled_unit_cost = totalItemCost / newQty;
                      }

                      setReconcileItems(newItems);
                    }}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-2">
                    <option value="">(Não vincular / Pular)</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                  </select>
                  {item.product_id && products.find(p => p.id === item.product_id)?.unit_conversion_factor > 1 && (
                    <p className="text-xs text-blue-400 mt-1">Conversão Automática: x{products.find(p => p.id === item.product_id)?.unit_conversion_factor}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Efetivar Qtd de Estoque</label>
                  <input
                    type="number" step="0.001"
                    value={item.reconciled_quantity}
                    onChange={(e) => {
                      const newItems = [...reconcileItems];
                      const newQty = parseFloat(e.target.value) || 0;
                      newItems[index].reconciled_quantity = newQty;

                      if (newQty > 0) {
                        const totalItemsValue = reconcileItems.reduce((acc, i) => acc + (i.raw_quantity * i.raw_unit_price), 0);
                        const freightAmount = parseFloat(editingOrder.freight_amount) || 0;
                        const itemRawValue = item.raw_quantity * item.raw_unit_price;
                        const proportion = totalItemsValue > 0 ? (itemRawValue / totalItemsValue) : 0;
                        const freightShare = proportion * freightAmount;
                        const totalItemCost = itemRawValue + freightShare;

                        newItems[index].reconciled_unit_cost = totalItemCost / newQty;
                      }
                      setReconcileItems(newItems);
                    }}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Custo Novo (R$)</label>
                  <input
                    type="number" step="0.01" readOnly disabled
                    value={item.reconciled_unit_cost?.toFixed(2) || '0.00'}
                    className="w-full bg-slate-800/50 border-slate-800 rounded-lg p-2 text-slate-400 text-center" />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button onClick={handleReconcile} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle size={20} /> Salvar e Efetivar Estoque
            </button>
          </div>
        </div>

        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Cadastrar Produto Rápido</h3>
                <button
                  onClick={() => { setIsProductModalOpen(false); setProductCreationIndex(null); }}
                  className="text-slate-400 hover:text-white"
                ><XCircle size={24} /></button>
              </div>

              <form onSubmit={handleSaveQuickProduct} className="space-y-4">
                <p className="text-sm text-slate-400">Este atalho cria um produto <strong>simples</strong> e sem categoria para facilitar a entrada. Você pode editá-lo depois no cadastro completo.</p>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome do Produto</label>
                  <input name="name" defaultValue={productCreationIndex !== null && reconcileItems[productCreationIndex] ? reconcileItems[productCreationIndex].raw_name : ''} required className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Unidade</label>
                    <select name="unit" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm">
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="caixa">Caixa</option>
                      <option value="pct">Pacote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Preço de Venda (R$)</label>
                    <input type="number" step="0.01" name="sell_price" defaultValue="0" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2" />
                  </div>
                </div>

                <div className="flex justify-end pt-4 mt-6 border-t border-slate-700 gap-2">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold">Criar e Vincular</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Pedidos de Compra</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Users size={18} /> Fornecedores
          </button>
          <button
            onClick={() => setView('new_order')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
          >
            <Plus size={18} /> Novo Pedido
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden max-w-full overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Fornecedor</th>
              <th className="px-6 py-4">NF</th>
              <th className="px-6 py-4">Produtos</th>
              <th className="px-6 py-4">Frete</th>
              <th className="px-6 py-4">Total Nota</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-800/30">
                <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-slate-200">{order.supplier_name}</td>
                <td className="px-6 py-4 text-slate-400">{order.invoice_number}</td>
                <td className="px-6 py-4 text-emerald-400">R$ {order.total_amount?.toFixed(2)}</td>
                <td className="px-6 py-4 text-orange-400">R$ {(order.freight_amount || 0).toFixed(2)}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">R$ {((parseFloat(order.total_amount) || 0) + (parseFloat(order.freight_amount) || 0)).toFixed(2)}</td>
                <td className="px-6 py-4">
                  {order.status === 'pending' ? (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-orange-500/20 text-orange-400 uppercase">Pendente</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400 uppercase">Conciliado</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => startReconciliation(order)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                      >
                        <CheckCircle size={14} /> Conciliar
                      </button>
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setNewOrderItems(order.items.length > 0 ? order.items : [{ raw_name: '', raw_quantity: 1, raw_unit_price: 0 }]);
                          setView('new_order');
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar Pedido"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500 italic">Nenhum pedido de compra registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Gerenciar Fornecedores</h3>
              <button onClick={() => { setIsSupplierModalOpen(false); setEditingSupplier(null); }} className="text-slate-400 hover:text-white"><XCircle size={24} /></button>
            </div>

            <form onSubmit={handleSaveSupplier} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6 space-y-4">
              <h4 className="font-bold text-sm text-blue-400">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome</label>
                  <input name="name" defaultValue={editingSupplier?.name} required className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">CNPJ/CPF</label>
                  <input name="document" defaultValue={editingSupplier?.document} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                  <input name="phone" defaultValue={editingSupplier?.phone} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingSupplier && (
                  <button type="button" onClick={() => setEditingSupplier(null)} className="text-slate-400 text-sm px-3 hover:text-white">Cancelar</button>
                )}
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-bold">
                  {editingSupplier ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-2 rounded-tl-lg">Nome</th>
                    <th className="px-4 py-2">Documento</th>
                    <th className="px-4 py-2">Telefone</th>
                    <th className="px-4 py-2 text-right rounded-tr-lg">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-slate-400">{s.document || '-'}</td>
                      <td className="px-4 py-3 text-slate-400">{s.phone || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditingSupplier(s)} className="text-blue-400 p-1 hover:bg-blue-500/10 rounded"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteSupplier(s.id)} className="text-red-400 p-1 hover:bg-red-500/10 rounded ml-1"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-4 text-slate-500 italic">Nenhum fornecedor cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

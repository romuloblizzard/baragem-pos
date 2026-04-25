import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, DollarSign,
  Plus, Search, Edit, Trash2, CheckCircle, XCircle, ClipboardList, List, Home, Settings as SettingsIcon, Printer, Users, ShoppingCart, X, LogOut,
  FileSpreadsheet, Download, Upload, TableProperties, Calculator, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

const formatCategoryName = (name: string) => {
  if (!name) return '';
  return name.replace(/^[🟡🟢🔵🟠🟣🔴⚫]\s*(?:[0-9]+\.\s*)?/, '');
};

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
          <button 
            onClick={async () => {
              if (!confirm('Deseja realmente sair dessa conta?')) return;
              try { await api.logout(localStorage.getItem('pos_employee_id') || undefined); } catch (e) {}
              localStorage.removeItem('pos_role');
              localStorage.removeItem('pos_employee_name');
              localStorage.removeItem('pos_login_time');
              localStorage.removeItem('pos_employee_id');
              window.location.href = '/';
            }}
            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors" 
            title="Sair / Trocar Usuário"
          >
            <LogOut size={20} />
          </button>
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
            { id: 'menu', label: 'Cardápio', icon: List },
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
        {activeTab === 'menu' && (
          <div className="flex flex-col h-[60vh] items-center justify-center gap-8">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">Cardápio Digital</h2>
            <div className="flex gap-6">
              <a href="/menu" target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-2xl flex flex-col items-center gap-3 transition-transform hover:scale-105 shadow-xl shadow-blue-900/20">
                <Printer size={40} />
                <span className="font-bold text-lg">Visualizar / Imprimir A4</span>
              </a>
              <a href="/menu-config" target="_blank" rel="noreferrer" className="bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 hover:border-slate-500 text-white px-8 py-6 rounded-2xl flex flex-col items-center gap-3 transition-transform hover:scale-105 shadow-xl shadow-black/20">
                <SettingsIcon size={40} />
                <span className="font-bold text-lg">Configurar Cardápio</span>
              </a>
            </div>
            <p className="text-slate-400 mt-4 max-w-md text-center">Configure quais produtos aparecem em cada página, a ordem das categorias e remova insumos do cardápio final.</p>
          </div>
        )}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = () => api.getCategories().then(setCategories);

  const parentCategories = categories.filter(c => !c.parent_id);
  const childCategories = categories.filter(c => !!c.parent_id);

  const openModal = (cat: any = null, parentId: number | null = null) => {
    setEditingCategory(cat);
    setDefaultParentId(parentId);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const parentIdVal = formData.get('parent_id');
    const data = {
      id: editingCategory?.id,
      name: formData.get('name') as string,
      parent_id: parentIdVal ? Number(parentIdVal) : null,
      show_on_waiter: formData.get('show_on_waiter') === 'true',
    };
    try {
      await api.saveCategory(data);
      setIsModalOpen(false);
      setEditingCategory(null);
      setDefaultParentId(null);
      loadCategories();
    } catch (err) {
      alert('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: number) => {
    const hasChildren = childCategories.some(c => c.parent_id === id);
    if (hasChildren) {
      alert('Esta categoria possui subcategorias. Remova ou mova as subcategorias antes de excluir.');
      return;
    }
    if (!confirm('Tem certeza? Isso pode falhar se houver produtos nesta categoria.')) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert('Não foi possível excluir. Verifique se há produtos vinculados.');
    }
  };

  // Resolve parent_id being used in modal
  const modalIsChild = editingCategory ? !!editingCategory.parent_id : defaultParentId !== null;
  const modalParentId = editingCategory?.parent_id ?? defaultParentId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <p className="text-slate-400 text-sm mt-1">Organize produtos em Categorias Pai e Subcategorias</p>
        </div>
        <button
          onClick={() => openModal(null, null)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      {/* Parent categories with their children */}
      <div className="space-y-4">
        {parentCategories.length === 0 && (
          <div className="text-center py-16 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
            <List size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma categoria Pai criada</p>
            <p className="text-sm mt-1">Crie uma categoria Pai para começar a organizar</p>
          </div>
        )}

        {parentCategories
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
          .map(parent => {
          const children = childCategories.filter(c => c.parent_id === parent.id);
          return (
            <div key={parent.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center justify-between px-5 py-4 bg-slate-800/40 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="font-bold text-slate-100 text-base">{formatCategoryName(parent.name)}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {children.length} {children.length === 1 ? 'subcategoria' : 'subcategorias'}
                  </span>
                  {parent.show_on_waiter
                    ? <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">👨‍🍳 Visível no garçom</span>
                    : <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Oculto no garçom</span>
                  }
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(null, parent.id)}
                    title="Adicionar subcategoria"
                    className="text-emerald-400 hover:text-emerald-300 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus size={13} /> Sub
                  </button>
                  <button
                    onClick={() => openModal(parent, null)}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(parent.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Children rows */}
              {children.length > 0 && (
                <div className="divide-y divide-slate-800/60">
                  {children.map(child => (
                    <div key={child.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-3 pl-5">
                        <div className="w-px h-4 bg-slate-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span className="text-slate-300 text-sm">{child.name}</span>
                        {child.show_on_waiter
                          ? <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">👨‍🍳 Visível</span>
                          : <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Oculto</span>
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openModal(child, null)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(child.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {children.length === 0 && (
                <div
                  className="px-5 py-3 pl-14 text-xs text-slate-600 italic cursor-pointer hover:text-slate-500 transition-colors"
                  onClick={() => openModal(null, parent.id)}
                >
                  + Adicionar subcategoria em {parent.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Orphan children (parent deleted) */}
        {childCategories.filter(c => !parentCategories.find(p => p.id === c.parent_id)).length > 0 && (
          <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4">
            <p className="text-amber-400 text-xs font-bold uppercase mb-3">⚠ Subcategorias sem Pai</p>
            <div className="space-y-2">
              {childCategories.filter(c => !parentCategories.find(p => p.id === c.parent_id)).map(orphan => (
                <div key={orphan.id} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{orphan.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(orphan, null)} className="text-blue-400 p-1.5 hover:bg-blue-500/10 rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(orphan.id)} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-1">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <p className="text-slate-400 text-sm mb-5">
              {modalIsChild ? 'Criando como subcategoria' : 'Criando como categoria principal'}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  autoFocus
                  placeholder="Ex: Cervejas, Bebidas, Comidas..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-100"
                />
              </div>
              {!modalParentId && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cor de Destaque no Painel do Garçom</label>
                  <div className="flex gap-2 mb-1">
                    {['🟡', '🟢', '🔵', '🟠', '🟣', '🔴', '⚫'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                           const input = document.querySelector('input[name="name"]') as HTMLInputElement;
                           if (input) {
                              const cleanName = input.value.replace(/^[🟡🟢🔵🟠🟣🔴⚫]\s*/, '');
                              input.value = emoji + ' ' + cleanName;
                           }
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700 transition-colors text-lg shadow-sm"
                        title="Atribuir esta cor à categoria"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Opcional. Adiciona a cor base para os botões e categorias estruturais.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria Pai <span className="text-slate-600">(opcional)</span></label>
                <select
                  name="parent_id"
                  defaultValue={modalParentId ?? ''}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-100"
                >
                  <option value="">— Nenhuma (será categoria Pai) —</option>
                  {parentCategories
                    .filter(p => p.id !== editingCategory?.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>{formatCategoryName(p.name)}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Visibilidade no Garçom</label>
                <select
                  name="show_on_waiter"
                  defaultValue={editingCategory ? String(editingCategory.show_on_waiter ?? true) : 'true'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-100"
                >
                  <option value="true">👨‍🍳 Visível no painel do garçom</option>
                  <option value="false">🔒 Oculto no painel do garçom</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingCategory(null); setDefaultParentId(null); }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Salvar
                </button>
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
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-300">
                      R$ {(item.quantity * item.price_at_time).toFixed(2)}
                    </p>
                    {viewDetailsOrder.status !== 'paid' && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Remover "${item.product_name}" da comanda?`)) return;
                          try {
                            await api.removeOrderItem(viewDetailsOrder.id, item.id);
                            const updated = await api.getOrder(viewDetailsOrder.pulseira);
                            setViewDetailsOrder(updated);
                            api.getOrders('open').then(setOrders);
                          } catch (e) { alert('Erro ao remover item'); }
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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
  const [data, setData] = useState<any>({ orders: [], transactions: [], cashier_sessions: [] });
  const [settings, setSettings] = useState<any>({});
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, name: string, pct: number}>>([]);
  const [teamPayments, setTeamPayments] = useState<Array<{id: string, dateStart: string, dateEnd: string, name: string, amount: number}>>(() => {
    try { return JSON.parse(localStorage.getItem('pos_team_payments') || '[]'); } catch { return []; }
  });
  const [payForm, setPayForm] = useState({ name: '', amount: '', dateStart: '', dateEnd: '' });

  const savePayment = () => {
    if (!payForm.name || !payForm.amount || !payForm.dateStart || !payForm.dateEnd) return;
    const entry = { id: Date.now().toString(), dateStart: payForm.dateStart, dateEnd: payForm.dateEnd, name: payForm.name, amount: parseFloat(payForm.amount) };
    const updated = [entry, ...teamPayments];
    setTeamPayments(updated);
    localStorage.setItem('pos_team_payments', JSON.stringify(updated));
    setPayForm({ name: '', amount: '', dateStart: '', dateEnd: '' });
  };

  const fillPayForm = (name: string, amount: number) => {
    const now = new Date();
    let ds = '';
    let de = now.toISOString().slice(0, 10);
    if (teamDays === 15) { const d = new Date(now); d.setDate(d.getDate() - 15); ds = d.toISOString().slice(0, 10); }
    else if (teamDays === 20) { const d = new Date(now); d.setDate(d.getDate() - 20); ds = d.toISOString().slice(0, 10); }
    else if (teamDays === 'custom') { ds = teamStart; de = teamEnd; }
    setPayForm({ name, amount: amount.toFixed(2), dateStart: ds, dateEnd: de });
  };

  const removePayment = (id: string) => {
    const updated = teamPayments.filter(p => p.id !== id);
    setTeamPayments(updated);
    localStorage.setItem('pos_team_payments', JSON.stringify(updated));
  };
  const [teamDays, setTeamDays] = useState<15 | 20 | 'custom'>(15);
  const [teamStart, setTeamStart] = useState('');
  const [teamEnd, setTeamEnd] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Date filters
  const [historyPeriod, setHistoryPeriod] = useState<'today' | 'month' | 'custom' | 'all' | 'bank' | 'team'>('today');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Sub Tabs
  const [subTab, setSubTab] = useState<'summary' | 'products' | 'cashier' | 'orders'>('summary');
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any>(null);

  // Products tab sort
  const [productSort, setProductSort] = useState<{ field: 'name' | 'quantity' | 'revenue', dir: 'asc' | 'desc' }>({ field: 'revenue', dir: 'desc' });
  const toggleProductSort = (field: 'name' | 'quantity' | 'revenue') => {
    setProductSort(prev => prev.field === field
      ? { field, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { field, dir: field === 'name' ? 'asc' : 'desc' }
    );
  };

  // Detailed View State
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [drillDownModal, setDrillDownModal] = useState<{type: 'day' | 'gross' | 'cmv' | 'net', date: string, data: any} | null>(null);

  // Daily Stats grouping
  const dailyStats = useMemo(() => {
    const statsMap: Record<string, any> = ({});
    
    data.orders.forEach((order: any) => {
      const date = new Date(order.created_at).toLocaleDateString('pt-BR');
      if (!statsMap[date]) statsMap[date] = { date, gross: 0, cmv: 0, debit: 0, credit: 0, pix: 0, cashier: 0, orders: [], items: [], transactions: [] };
      
      let orderGross = 0;
      let orderCmv = 0;
      order.items?.forEach((item: any) => {
        const itemGross = (item.quantity || 0) * (item.price_at_time || 0);
        const itemCmv = (item.quantity || 0) * (item.cost_at_time || 0);
        orderGross += itemGross;
        orderCmv += itemCmv;
        statsMap[date].items.push({ ...item, waiter: order.waiter?.name || 'Sistema', pulseira: order.pulseira });
      });
      
      statsMap[date].gross += orderGross;
      statsMap[date].cmv += orderCmv;
      statsMap[date].orders.push(order);
    });

    data.transactions.forEach((tx: any) => {
      const dateString = new Date(tx.created_at).toLocaleDateString('pt-BR');
      if (!statsMap[dateString]) {
         statsMap[dateString] = { date: dateString, gross: 0, cmv: 0, card: 0, pix: 0, cashier: 0, orders: [], items: [], transactions: [] };
      }
      statsMap[dateString].transactions.push(tx);
      if (tx.method === 'debit') statsMap[dateString].debit += Number(tx.amount || 0);
      if (tx.method === 'credit') statsMap[dateString].credit += Number(tx.amount || 0);
      if (tx.method === 'card') statsMap[dateString].credit += Number(tx.amount || 0); // legado
      if (tx.method === 'pix') statsMap[dateString].pix += Number(tx.amount || 0);
    });

    data.cashier_sessions.forEach((session: any) => {
      if (session.closed_at) {
        const dateString = new Date(session.closed_at).toLocaleDateString('pt-BR');
        if (!statsMap[dateString]) {
           statsMap[dateString] = { date: dateString, gross: 0, cmv: 0, card: 0, pix: 0, cashier: 0, orders: [], items: [], transactions: [] };
        }
        statsMap[dateString].cashier += Number(session.final_balance || 0);
      }
    });

    return Object.values(statsMap).sort((a: any, b: any) => {
        const [da, ma, ya] = a.date.split('/');
        const [db, mb, yb] = b.date.split('/');
        return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime();
    }).reverse();
  }, [data]);


  useEffect(() => {
    loadData();
  }, [historyPeriod, historyStartDate, historyEndDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      let isoStart: string | undefined;
      let isoEnd: string | undefined;
      const now = new Date();
      
      if (historyPeriod === 'today') {
        const d = new Date(now);
        d.setHours(0,0,0,0);
        isoStart = d.toISOString();
      } else if (historyPeriod === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        isoStart = d.toISOString();
      } else if (historyPeriod === 'custom') {
        if (historyStartDate) {
           const d = new Date(historyStartDate);
           const userOffset = d.getTimezoneOffset() * 60000;
           isoStart = new Date(d.getTime() + userOffset).toISOString();
        }
        if (historyEndDate) {
           const d = new Date(historyEndDate);
           const userOffset = d.getTimezoneOffset() * 60000;
           d.setTime(d.getTime() + userOffset);
           d.setHours(23,59,59,999);
           isoEnd = d.toISOString();
        }
      }
      
      const [res, sett] = await Promise.all([api.getGeneralHistory(isoStart, isoEnd), api.getSettings()]);
      setData(res);
      setSettings(sett);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Payment Methods: Group transactions by method
  const paymentMethods = data.transactions?.reduce((acc: any, t: any) => {
    acc[t.method] = (acc[t.method] || 0) + Number(t.amount);
    return acc;
  }, {}) || {};

  // 2. Products Sold: iterate orders -> items -> group by product_name
  const productSalesMap = data.orders?.reduce((acc: any, order: any) => {
    order.items?.forEach((item: any) => {
       const name = item.products?.name || `ID ${item.product_id}`;
       if (!acc[name]) acc[name] = { quantity: 0, revenue: 0 };
       acc[name].quantity += item.quantity;
       acc[name].revenue += item.quantity * item.price_at_time;
    });
    return acc;
  }, {}) || {};
  const productSales = Object.entries(productSalesMap)
    .map(([name, stats]: [string, any]) => ({ name, ...stats }))
    .sort((a: any, b: any) => {
      const { field, dir } = productSort;
      let cmp = 0;
      if (field === 'name') cmp = a.name.localeCompare(b.name, 'pt-BR');
      else if (field === 'quantity') cmp = a.quantity - b.quantity;
      else cmp = a.revenue - b.revenue;
      return dir === 'desc' ? -cmp : cmp;
    });

  const totalViewDetails = viewDetailsOrder?.items?.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0) || 0;

  // 4. Cashier sessions with calculated stats
  const cashierStats = useMemo(() => {
    const fixedSet = new Set(data.fixedPulseiras || []);

    return (data.cashier_sessions || []).map((session: any) => {
      const sessionStart = new Date(session.opened_at);
      const sessionEnd = session.closed_at ? new Date(session.closed_at) : new Date();

      // Orders within session window, excluding fixed pulseiras
      const sessionOrders = (data.orders || []).filter((o: any) => {
        const t = new Date(o.created_at);
        return t >= sessionStart && t <= sessionEnd && !fixedSet.has(o.pulseira) && o.status === 'paid';
      });

      // IDs of included orders (to filter matching transactions)
      const includedOrderIds = new Set(sessionOrders.map((o: any) => o.id));

      // Gross = sum of items sold (product value only)
      let gross = 0;
      let cmv = 0;
      sessionOrders.forEach((o: any) => {
        o.items?.forEach((item: any) => {
          gross += (item.quantity || 0) * (item.price_at_time || 0);
          cmv += (item.quantity || 0) * (item.cost_at_time || 0);
        });
      });

      // Taxa = real amount collected from non-fixed orders
      const sessionTxTotal = (data.transactions || [])
        .filter((tx: any) => {
          const t = new Date(tx.created_at);
          return t >= sessionStart && t <= sessionEnd && includedOrderIds.has(tx.order_id);
        })
        .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);
      const taxa = Math.max(0, sessionTxTotal - gross);

      const net = gross + taxa - cmv;
      return { ...session, gross, taxa, cmv, net };
    }).filter((s: any) => s.gross > 0 || s.cmv > 0);
  }, [data]);

  const cashierTotals = useMemo(() => cashierStats.reduce(
    (acc: any, s: any) => ({ gross: acc.gross + s.gross, taxa: acc.taxa + s.taxa, cmv: acc.cmv + s.cmv, net: acc.net + s.net }),
    { gross: 0, taxa: 0, cmv: 0, net: 0 }
  ), [cashierStats]);

  // 5. Bank stats per cashier session
  const bankStats = useMemo(() => {
    const feeDebit  = parseFloat(settings.fee_debit  || '0') / 100;
    const feeCredit = parseFloat(settings.fee_credit || '0') / 100;
    const feePix    = parseFloat(settings.fee_pix    || '0') / 100;

    return (data.cashier_sessions || []).map((session: any) => {
      const sStart = new Date(session.opened_at);
      const sEnd   = session.closed_at ? new Date(session.closed_at) : new Date();

      const txs = (data.transactions || []).filter((tx: any) => {
        const t = new Date(tx.created_at);
        return t >= sStart && t <= sEnd;
      });

      const debit  = txs.filter((tx: any) => tx.method === 'debit' ).reduce((a: number, tx: any) => a + Number(tx.amount), 0);
      const credit = txs.filter((tx: any) => tx.method === 'credit' || tx.method === 'card').reduce((a: number, tx: any) => a + Number(tx.amount), 0);
      const pix    = txs.filter((tx: any) => tx.method === 'pix'   ).reduce((a: number, tx: any) => a + Number(tx.amount), 0);

      return {
        ...session,
        debit,  debitNet:  debit  * (1 - feeDebit),  debitFeeAmt:  debit  * feeDebit,  feeDebitPct:  feeDebit  * 100,
        credit, creditNet: credit * (1 - feeCredit), creditFeeAmt: credit * feeCredit, feeCreditPct: feeCredit * 100,
        pix,    pixNet:    pix    * (1 - feePix),    pixFeeAmt:    pix    * feePix,    feePixPct:    feePix    * 100,
        totalBank: debit * (1 - feeDebit) + credit * (1 - feeCredit) + pix * (1 - feePix),
      };
    }).filter((s: any) => s.debit > 0 || s.credit > 0 || s.pix > 0);
  }, [data, settings]);

  const bankTotals = useMemo(() => bankStats.reduce(
    (acc: any, s: any) => ({
      debit:      acc.debit      + s.debit,
      debitNet:   acc.debitNet   + s.debitNet,
      credit:     acc.credit     + s.credit,
      creditNet:  acc.creditNet  + s.creditNet,
      pix:        acc.pix        + s.pix,
      pixNet:     acc.pixNet     + s.pixNet,
      totalBank:  acc.totalBank  + s.totalBank,
    }),
    { debit: 0, debitNet: 0, credit: 0, creditNet: 0, pix: 0, pixNet: 0, totalBank: 0 }
  ), [bankStats]);

  // 6. Team taxa stats — filtered by selected period
  const teamStats = useMemo(() => {
    const now = new Date();
    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;
    if (teamDays === 15) { filterStart = new Date(now); filterStart.setDate(filterStart.getDate() - 15); }
    else if (teamDays === 20) { filterStart = new Date(now); filterStart.setDate(filterStart.getDate() - 20); }
    else if (teamDays === 'custom') {
      if (teamStart) filterStart = new Date(teamStart);
      if (teamEnd) { filterEnd = new Date(teamEnd); filterEnd.setHours(23, 59, 59, 999); }
    }

    return cashierStats
      .filter((s: any) => {
        const opened = new Date(s.opened_at);
        if (filterStart && opened < filterStart) return false;
        if (filterEnd && opened > filterEnd) return false;
        return s.taxa > 0;
      })
      .map((s: any) => ({ ...s }));
  }, [cashierStats, teamDays, teamStart, teamEnd]);

  const teamTotalTaxa = useMemo(() => teamStats.reduce((a: number, s: any) => a + s.taxa, 0), [teamStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="text-blue-400" /> Relatórios e Histórico
        </h2>
      </div>

      {/* Date Filters */}
      <div className="p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center bg-slate-900/50">
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button onClick={() => { setHistoryPeriod('today'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'today' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hoje</button>
          <button onClick={() => { setHistoryPeriod('month'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Este Mês</button>
          <button onClick={() => { setHistoryPeriod('custom'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'custom' && !isDetailedView ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Personalizado</button>
          <button
            onClick={() => setIsDetailedView(!isDetailedView)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isDetailedView ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Histórico Detalhado de Vendas"
          >
            <TableProperties size={18} /> Histórico
          </button>
          <button onClick={() => { setHistoryPeriod('all'); setSubTab('orders'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Comandas / Caixa</button>
          <button onClick={() => { setHistoryPeriod('bank'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'bank' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Banco</button>
          <button onClick={() => { setHistoryPeriod('team'); setIsDetailedView(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'team' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Taxa / Equipe</button>
        </div>

        {historyPeriod === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            <span className="text-slate-500">até</span>
            <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        )}
      </div>

      {/* Sub tabs */}
      {!isDetailedView && historyPeriod !== 'all' && historyPeriod !== 'bank' && historyPeriod !== 'team' && (
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide">
          <button onClick={() => setSubTab('summary')} className={`px-6 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${subTab === 'summary' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Resumo e Pagamentos</button>
          <button onClick={() => setSubTab('products')} className={`px-6 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${subTab === 'products' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Produtos Vendidos</button>
          <button onClick={() => setSubTab('cashier')} className={`px-6 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${subTab === 'cashier' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Caixa (Abertura/Fecho)</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          
          {isDetailedView ? (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[800px]">
                 <thead className="text-slate-400 uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">Dia (Data)</th>
                      <th className="px-4 py-3 text-right">Vendido Bruto</th>
                      <th className="px-4 py-3 text-right text-xs">CMV</th>
                      <th className="px-4 py-3 text-right text-xs text-sky-400">Débito</th>
                      <th className="px-4 py-3 text-right text-xs text-purple-400">Crédito</th>
                      <th className="px-4 py-3 text-right text-xs text-teal-400">Pix</th>
                      <th className="px-4 py-3 text-right text-xs text-emerald-400">Saldo Caixa</th>
                      <th className="px-4 py-3 text-right">Valor Líquido (Lucro)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                    {dailyStats.filter((d: any) => d.gross > 0 || d.cmv > 0 || (d.debit||0) > 0 || (d.credit||0) > 0 || (d.pix||0) > 0 || (d.cashier||0) > 0).length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-500">Nenhuma movimentação no período.</td></tr>}
                    {dailyStats.filter((d: any) => d.gross > 0 || d.cmv > 0 || (d.debit||0) > 0 || (d.credit||0) > 0 || (d.pix||0) > 0 || (d.cashier||0) > 0).map((day: any) => {
                      const net = day.gross - day.cmv;
                      return (
                        <tr key={day.date} className="hover:bg-slate-800/30 transition-colors">
                          <td 
                            onClick={() => setDrillDownModal({ type: 'day', date: day.date, data: day.orders })}
                            className="px-4 py-4 text-blue-400 font-medium cursor-pointer hover:underline"
                          >
                            {day.date}
                          </td>
                          <td 
                            onClick={() => setDrillDownModal({ type: 'gross', date: day.date, data: day.items })}
                            className="px-4 py-4 text-right text-emerald-400 font-bold cursor-pointer hover:bg-emerald-500/10"
                          >
                            R$ {day.gross.toFixed(2)}
                          </td>
                          <td 
                             onClick={() => setDrillDownModal({ type: 'cmv', date: day.date, data: day.items })}
                             className="px-4 py-4 text-right text-amber-400 font-medium cursor-pointer hover:bg-amber-500/10"
                          >
                            R$ {day.cmv.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-sky-400/80 font-medium">
                            R$ {(day.debit || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-purple-400/80 font-medium">
                            R$ {(day.credit || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-teal-400/80 font-medium">
                            R$ {(day.pix || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-emerald-400 font-bold bg-emerald-500/5">
                            R$ {(day.cashier || 0).toFixed(2)}
                          </td>
                          <td 
                             onClick={() => setDrillDownModal({ type: 'net', date: day.date, data: { transactions: day.transactions } })}
                             className="px-4 py-4 text-right text-purple-400 font-bold cursor-pointer hover:bg-purple-500/10"
                          >
                            R$ {net.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
          ) : (
            <>
          {subTab === 'summary' && historyPeriod !== 'all' && historyPeriod !== 'bank' && historyPeriod !== 'team' && (
             <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                   <p className="text-sm text-slate-400">Total Faturado</p>
                   <h3 className="text-3xl font-bold text-emerald-400 mt-1">R$ {Number(Object.values(paymentMethods).reduce((a:any,b:any)=>a+Number(b), 0)).toFixed(2)}</h3>
                   <p className="text-xs text-slate-500 mt-1">{data.transactions?.length || 0} transações</p>
                 </div>
                 <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                   <p className="text-sm text-slate-400">Total de Pedidos</p>
                   <h3 className="text-3xl font-bold text-blue-400 mt-1">{data.orders?.length || 0} comandas</h3>
                 </div>
                 <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                   <p className="text-sm text-slate-400">Produtos Vendidos</p>
                   <h3 className="text-3xl font-bold text-purple-400 mt-1">{productSales.reduce((acc, p) => acc + p.quantity, 0)} unid.</h3>
                 </div>
               </div>

               <h3 className="text-lg font-bold mt-8 border-b border-slate-800 pb-2">Formas de Pagamento</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {Object.entries(paymentMethods).map(([method, total]: [string, any]) => (
                   <div key={method} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                     <p className="uppercase text-xs font-bold text-slate-400 mb-1">{method === 'cash' ? 'Dinheiro' : method}</p>
                     <p className="text-xl font-bold text-emerald-400">R$ {Number(total).toFixed(2)}</p>
                   </div>
                 ))}
                 {Object.keys(paymentMethods).length === 0 && <p className="text-slate-500 col-span-full">Nenhum pagamento registrado neste período.</p>}
               </div>
             </div>
          )}

          {subTab === 'products' && historyPeriod !== 'all' && historyPeriod !== 'bank' && historyPeriod !== 'team' && (() => {
            const SortIcon = ({ field }: { field: 'name' | 'quantity' | 'revenue' }) => {
              if (productSort.field !== field) return <span className="text-slate-600 ml-1">↕</span>;
              return <span className="text-blue-400 ml-1">{productSort.dir === 'desc' ? '↓' : '↑'}</span>;
            };
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="text-slate-400 uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">
                        <button onClick={() => toggleProductSort('name')} className="flex items-center gap-1 hover:text-white transition-colors">
                          Produto <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button onClick={() => toggleProductSort('quantity')} className="flex items-center gap-1 hover:text-white transition-colors">
                          Unidades Vendidas <SortIcon field="quantity" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button onClick={() => toggleProductSort('revenue')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto">
                          Faturamento Bruto <SortIcon field="revenue" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {productSales.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-slate-500">Nenhum produto vendido no período.</td></tr>}
                    {productSales.map((p: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                        <td className="px-4 py-3 text-slate-400">{p.quantity}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">R$ {p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {subTab === 'cashier' && historyPeriod !== 'all' && historyPeriod !== 'bank' && historyPeriod !== 'team' && (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[1100px]">
                 <thead className="text-slate-400 uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">Abertura</th>
                      <th className="px-4 py-3">Fechamento</th>
                      <th className="px-4 py-3 text-right">Saldo Inicial</th>
                      <th className="px-4 py-3 text-right">Dinheiro</th>
                      <th className="px-4 py-3 text-right">Crédito</th>
                      <th className="px-4 py-3 text-right">Débito</th>
                      <th className="px-4 py-3 text-right">PIX</th>
                      <th className="px-4 py-3 text-right">Diferença/Sangria</th>
                      <th className="px-4 py-3 text-right">Saldo Final da Gaveta</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                    {data.cashier_sessions?.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-500">Nenhum histórico de caixa no período.</td></tr>}
                    {data.cashier_sessions?.map((c: any, idx: number) => {
                      const sessionStart = new Date(c.opened_at).getTime();
                      const sessionEnd = c.closed_at ? new Date(c.closed_at).getTime() : Date.now();
                      const sessionTxs = (data.transactions || []).filter((t: any) => {
                        const ts = new Date(t.created_at).getTime();
                        return ts >= sessionStart && ts <= sessionEnd;
                      });
                      const sumMethod = (method: string) =>
                        sessionTxs.filter((t: any) => t.method === method).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

                      const cashSales   = sumMethod('cash');
                      const creditSales = sumMethod('credit');
                      const debitSales  = sumMethod('debit');
                      const pixSales    = sumMethod('pix');
                      const dinheiro    = Number(c.initial_balance || 0) + cashSales;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-medium text-slate-300">{new Date(c.opened_at).toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-slate-400">{c.closed_at ? new Date(c.closed_at).toLocaleString('pt-BR') : <span className="text-emerald-400 font-bold px-2 py-1 bg-emerald-500/20 rounded">EM ABERTO</span>}</td>
                          <td className="px-4 py-3 text-slate-500 text-right">R$ {Number(c.initial_balance || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-blue-400 text-right">R$ {dinheiro.toFixed(2)}</td>
                          <td className="px-4 py-3 text-purple-400 text-right">R$ {creditSales.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sky-400 text-right">R$ {debitSales.toFixed(2)}</td>
                          <td className="px-4 py-3 text-teal-400 text-right">R$ {pixSales.toFixed(2)}</td>
                          <td className="px-4 py-3 text-amber-400 text-right">{c.closed_at ? `R$ ${Number(c.amortization || 0).toFixed(2)}` : '-'}</td>
                          <td className="px-4 py-3 font-bold text-emerald-400 text-right">{c.closed_at ? `R$ ${Number(c.final_balance || 0).toFixed(2)}` : '-'}</td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
          )}

          {subTab === 'orders' && historyPeriod === 'all' && (
            <div className="space-y-4">
              {/* Totals summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total Vendido</p>
                  <p className="text-xl font-bold text-white">R$ {cashierTotals.gross.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-amber-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Taxa (10%)</p>
                  <p className="text-xl font-bold text-amber-400">R$ {cashierTotals.taxa.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-red-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">CMV</p>
                  <p className="text-xl font-bold text-red-400">R$ {cashierTotals.cmv.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-emerald-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Valor Líquido</p>
                  <p className="text-xl font-bold text-emerald-400">R$ {cashierTotals.net.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Vendido + Taxa − CMV</p>
                </div>
              </div>

              {/* Cashier sessions table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Abertura</th>
                      <th className="px-4 py-3 text-left">Fechamento</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Produtos Vendidos</th>
                      <th className="px-4 py-3 text-right">Taxa (10%)</th>
                      <th className="px-4 py-3 text-right">CMV</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-300">Valor Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cashierStats.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhuma sessão de caixa encontrada.</td></tr>
                    )}
                    {cashierStats.map((s: any) => (
                      <tr key={s.id} onClick={() => setSelectedSession(s)} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-blue-400 hover:underline whitespace-nowrap">{new Date(s.opened_at).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.closed_at ? new Date(s.closed_at).toLocaleString('pt-BR') : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${s.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {s.status === 'open' ? 'Aberto' : 'Fechado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-medium">R$ {s.gross.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-amber-400">R$ {s.taxa.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-red-400">R$ {s.cmv.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">R$ {s.net.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {cashierStats.length > 0 && (
                    <tfoot className="bg-slate-800/60 border-t-2 border-slate-700 text-sm font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-slate-400 uppercase text-xs tracking-wider">Total Geral</td>
                        <td className="px-4 py-3 text-right text-white">R$ {cashierTotals.gross.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-amber-400">R$ {cashierTotals.taxa.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-red-400">R$ {cashierTotals.cmv.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">R$ {cashierTotals.net.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {historyPeriod === 'bank' && (
            <div className="space-y-4">
              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-blue-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Débito Líquido</p>
                  <p className="text-xl font-bold text-blue-400">R$ {bankTotals.debitNet.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Bruto R$ {bankTotals.debit.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-purple-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Crédito Líquido</p>
                  <p className="text-xl font-bold text-purple-400">R$ {bankTotals.creditNet.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Bruto R$ {bankTotals.credit.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-cyan-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">PIX Líquido</p>
                  <p className="text-xl font-bold text-cyan-400">R$ {bankTotals.pixNet.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Bruto R$ {bankTotals.pix.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-emerald-900/40 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total a Receber</p>
                  <p className="text-xl font-bold text-emerald-400">R$ {bankTotals.totalBank.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Déb + Créd + PIX</p>
                </div>
              </div>

              {/* Per-session table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left" rowSpan={2}>Abertura</th>
                      <th className="px-4 py-3 text-left" rowSpan={2}>Fechamento</th>
                      <th className="px-4 py-3 text-center border-l border-slate-700" colSpan={3}>Débito</th>
                      <th className="px-4 py-3 text-center border-l border-slate-700" colSpan={3}>Crédito</th>
                      <th className="px-4 py-3 text-center border-l border-slate-700" colSpan={3}>PIX</th>
                      <th className="px-4 py-3 text-right border-l border-slate-700" rowSpan={2}>Total Banco</th>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 text-right border-l border-slate-700">Bruto</th>
                      <th className="px-3 py-2 text-right text-red-400">Taxa</th>
                      <th className="px-3 py-2 text-right text-blue-400">Líquido</th>
                      <th className="px-3 py-2 text-right border-l border-slate-700">Bruto</th>
                      <th className="px-3 py-2 text-right text-red-400">Taxa</th>
                      <th className="px-3 py-2 text-right text-purple-400">Líquido</th>
                      <th className="px-3 py-2 text-right border-l border-slate-700">Bruto</th>
                      <th className="px-3 py-2 text-right text-red-400">Taxa</th>
                      <th className="px-3 py-2 text-right text-cyan-400">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bankStats.length === 0 && (
                      <tr><td colSpan={12} className="py-8 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>
                    )}
                    {bankStats.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{new Date(s.opened_at).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.closed_at ? new Date(s.closed_at).toLocaleString('pt-BR') : '—'}</td>
                        {/* Débito */}
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {s.debit.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400 text-xs">-R$ {s.debitFeeAmt.toFixed(2)}<br/><span className="text-slate-600">{s.feeDebitPct.toFixed(1)}%</span></td>
                        <td className="px-3 py-3 text-right text-blue-400 font-medium">R$ {s.debitNet.toFixed(2)}</td>
                        {/* Crédito */}
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {s.credit.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400 text-xs">-R$ {s.creditFeeAmt.toFixed(2)}<br/><span className="text-slate-600">{s.feeCreditPct.toFixed(1)}%</span></td>
                        <td className="px-3 py-3 text-right text-purple-400 font-medium">R$ {s.creditNet.toFixed(2)}</td>
                        {/* PIX */}
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {s.pix.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400 text-xs">-R$ {s.pixFeeAmt.toFixed(2)}<br/><span className="text-slate-600">{s.feePixPct.toFixed(1)}%</span></td>
                        <td className="px-3 py-3 text-right text-cyan-400 font-medium">R$ {s.pixNet.toFixed(2)}</td>
                        {/* Total */}
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold border-l border-slate-800">R$ {s.totalBank.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {bankStats.length > 0 && (
                    <tfoot className="bg-slate-800/60 border-t-2 border-slate-700 font-bold text-sm">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-slate-400 uppercase text-xs tracking-wider">Total Geral</td>
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {bankTotals.debit.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400">-R$ {(bankTotals.debit - bankTotals.debitNet).toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-blue-400">R$ {bankTotals.debitNet.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {bankTotals.credit.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400">-R$ {(bankTotals.credit - bankTotals.creditNet).toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-purple-400">R$ {bankTotals.creditNet.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-slate-300 border-l border-slate-800">R$ {bankTotals.pix.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-red-400">-R$ {(bankTotals.pix - bankTotals.pixNet).toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-cyan-400">R$ {bankTotals.pixNet.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 border-l border-slate-800">R$ {bankTotals.totalBank.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {historyPeriod === 'team' && (() => {
            const totalPct = teamMembers.reduce((a, m) => a + m.pct, 0);
            const totalEmp = teamMembers.reduce((a, m) => a + teamTotalTaxa * (m.pct / 100), 0);
            const casaPct  = Math.max(0, 100 - totalPct);
            const casaVal  = teamTotalTaxa - totalEmp;
            return (
              <div className="space-y-6">
                {/* Period selector */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                    <button onClick={() => setTeamDays(15)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${teamDays === 15 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Últimos 15 dias</button>
                    <button onClick={() => setTeamDays(20)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${teamDays === 20 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Últimos 20 dias</button>
                    <button onClick={() => setTeamDays('custom')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${teamDays === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Personalizado</button>
                  </div>
                  {teamDays === 'custom' && (
                    <div className="flex gap-2 items-center">
                      <input type="date" value={teamStart} onChange={e => setTeamStart(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                      <span className="text-slate-500 text-sm">até</span>
                      <input type="date" value={teamEnd} onChange={e => setTeamEnd(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sessions table */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
                      <h4 className="font-semibold text-slate-200 text-sm">Sessões do Período</h4>
                      <span className="text-amber-400 font-bold text-sm">Total: R$ {teamTotalTaxa.toFixed(2)}</span>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Abertura</th>
                            <th className="px-3 py-2 text-left">Fechamento</th>
                            <th className="px-3 py-2 text-right text-amber-400">Taxa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {teamStats.length === 0 && (
                            <tr><td colSpan={3} className="py-6 text-center text-slate-500">Nenhuma sessão no período.</td></tr>
                          )}
                          {teamStats.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-800/30">
                              <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{new Date(s.opened_at).toLocaleString('pt-BR')}</td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{s.closed_at ? new Date(s.closed_at).toLocaleString('pt-BR') : '—'}</td>
                              <td className="px-3 py-2 text-right text-amber-400 font-medium">R$ {s.taxa.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Distribution table */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
                      <h4 className="font-semibold text-slate-200 text-sm">Distribuição por Equipe</h4>
                      <button
                        onClick={() => setTeamMembers(prev => [...prev, { id: Date.now().toString(), name: '', pct: 0 }])}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <PlusCircle size={14} /> Adicionar
                      </button>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {teamMembers.length === 0 && (
                        <p className="text-center text-slate-500 text-xs py-6">Clique em + Adicionar para incluir um membro</p>
                      )}
                      {teamMembers.map(m => (
                        <div key={m.id} className="flex items-center gap-2 px-4 py-3">
                          <input
                            type="text"
                            placeholder="Nome"
                            value={m.name}
                            onChange={e => setTeamMembers(prev => prev.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                          />
                          <input
                            type="number"
                            min="0" max="100" step="0.5"
                            value={m.pct}
                            onChange={e => setTeamMembers(prev => prev.map(x => x.id === m.id ? { ...x, pct: parseFloat(e.target.value) || 0 } : x))}
                            className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-slate-500 text-xs">%</span>
                          <span className="text-blue-400 text-sm font-bold w-20 text-right whitespace-nowrap">R$ {(teamTotalTaxa * (m.pct / 100)).toFixed(2)}</span>
                          <button
                            onClick={() => fillPayForm(m.name, teamTotalTaxa * (m.pct / 100))}
                            title="Preencher pagamento"
                            className="text-emerald-500 hover:text-emerald-300 transition-colors"
                          ><CheckCircle size={15} /></button>
                          <button onClick={() => setTeamMembers(prev => prev.filter(x => x.id !== m.id))} className="text-slate-600 hover:text-red-400 transition-colors"><X size={14} /></button>
                        </div>
                      ))}
                      {/* Casa row */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/30">
                        <span className="flex-1 text-emerald-400 text-sm font-bold">Casa</span>
                        <span className="w-16 text-right text-slate-400 text-sm">{casaPct.toFixed(1)}%</span>
                        <span className="text-slate-500 text-xs ml-1 mr-6">  </span>
                        <span className="text-emerald-400 text-sm font-bold w-20 text-right whitespace-nowrap">R$ {casaVal.toFixed(2)}</span>
                        <span className="w-4" />
                      </div>
                      {/* Total row */}
                      <div className="flex items-center gap-2 px-4 py-3 border-t-2 border-slate-700">
                        <span className="flex-1 text-slate-400 text-xs uppercase tracking-wider">Total</span>
                        <span className={`w-16 text-right text-sm font-bold ${Math.abs(totalPct + casaPct - 100) < 0.1 ? 'text-emerald-400' : 'text-red-400'}`}>{(totalPct + casaPct).toFixed(1)}%</span>
                        <span className="text-slate-500 text-xs ml-1 mr-6">  </span>
                        <span className="text-slate-200 text-sm font-bold w-20 text-right whitespace-nowrap">R$ {teamTotalTaxa.toFixed(2)}</span>
                        <span className="w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment registration */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40">
                    <h4 className="font-semibold text-slate-200 text-sm">Registrar Pagamento</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Confirme pagamentos realizados à equipe</p>
                  </div>
                  <div className="p-4 flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Funcionário</label>
                      <input
                        type="text" placeholder="Nome"
                        value={payForm.name}
                        onChange={e => setPayForm(p => ({ ...p, name: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-40"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Valor pago</label>
                      <input
                        type="number" placeholder="0.00" min="0" step="0.01"
                        value={payForm.amount}
                        onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-32"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Data início</label>
                      <input
                        type="date"
                        value={payForm.dateStart}
                        onChange={e => setPayForm(p => ({ ...p, dateStart: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Data fim</label>
                      <input
                        type="date"
                        value={payForm.dateEnd}
                        onChange={e => setPayForm(p => ({ ...p, dateEnd: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={savePayment}
                      disabled={!payForm.name || !payForm.amount || !payForm.dateStart || !payForm.dateEnd}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>

                  {/* Payment history */}
                  {teamPayments.length > 0 && (
                    <div className="border-t border-slate-800">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
                          <tr>
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-left">Funcionário</th>
                            <th className="px-4 py-2 text-right text-emerald-400">Valor Pago</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {teamPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/30">
                              <td className="px-4 py-2 text-slate-400 whitespace-nowrap text-xs">
                                {p.dateStart ? new Date(p.dateStart + 'T12:00:00').toLocaleDateString('pt-BR') : (p as any).date ? new Date((p as any).date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                                {p.dateEnd && p.dateStart !== p.dateEnd && <> → {new Date(p.dateEnd + 'T12:00:00').toLocaleDateString('pt-BR')}</>}
                              </td>
                              <td className="px-4 py-2 text-slate-200 font-medium">{p.name}</td>
                              <td className="px-4 py-2 text-right text-emerald-400 font-bold">R$ {p.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">
                                <button onClick={() => removePayment(p.id)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
            </>
          )}
        </div>
      )}

      {/* Session History Modal */}
      {selectedSession && (() => {
        const fixedSet = new Set(data.fixedPulseiras || []);
        const sStart = new Date(selectedSession.opened_at);
        const sEnd = selectedSession.closed_at ? new Date(selectedSession.closed_at) : new Date();
        const sessionOrders = (data.orders || []).filter((o: any) => {
          const t = new Date(o.created_at);
          if (!(t >= sStart && t <= sEnd && !fixedSet.has(o.pulseira) && o.status === 'paid')) return false;
          const total = (o.items || []).reduce((s: number, i: any) => s + (i.price_at_time * i.quantity), 0);
          return total > 0;
        }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const sessionGross = sessionOrders.reduce((acc: number, o: any) =>
          acc + (o.items || []).reduce((s: number, i: any) => s + (i.price_at_time * i.quantity), 0), 0);
        const sessionNet = selectedSession.net;

        // Map order_id → transactions
        const txByOrder: Record<number, any[]> = {};
        (data.transactions || []).forEach((tx: any) => {
          if (!txByOrder[tx.order_id]) txByOrder[tx.order_id] = [];
          txByOrder[tx.order_id].push(tx);
        });

        const methodLabel: Record<string, string> = { cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito', card: 'Crédito', pix: 'PIX' };
        const methodColor: Record<string, string> = { cash: 'bg-emerald-500/20 text-emerald-400', debit: 'bg-blue-500/20 text-blue-400', credit: 'bg-purple-500/20 text-purple-400', card: 'bg-purple-500/20 text-purple-400', pix: 'bg-cyan-500/20 text-cyan-400' };

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start p-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Histórico da Sessão</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Abertura: {new Date(selectedSession.opened_at).toLocaleString('pt-BR')}
                    {selectedSession.closed_at && <> &nbsp;·&nbsp; Fechamento: {new Date(selectedSession.closed_at).toLocaleString('pt-BR')}</>}
                  </p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white"><XCircle size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sessionOrders.length === 0 && <p className="text-center text-slate-500 py-8">Nenhuma comanda paga nesta sessão.</p>}
                {sessionOrders.map((order: any) => {
                  const orderTotal = order.items?.reduce((acc: number, i: any) => acc + (i.price_at_time * i.quantity), 0) || 0;
                  const orderTxs = txByOrder[order.id] || [];
                  const txTotal = orderTxs.reduce((a: number, tx: any) => a + Number(tx.amount), 0);
                  const taxa = Math.max(0, txTotal - orderTotal);
                  return (
                    <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">#{order.pulseira}</span>
                          <span className="font-medium text-slate-200">{order.customer_name || 'Sem Nome'}</span>
                        </div>
                        <span className="font-bold text-emerald-400">R$ {orderTotal.toFixed(2)}</span>
                      </div>

                      <div className="space-y-1 mt-2 pl-2 border-l border-slate-700">
                        {Object.values(
                          (order.items || []).reduce((acc: any, item: any) => {
                            const name = item.products?.name || `Produto #${item.product_id}`;
                            if (!acc[name]) acc[name] = { name, quantity: 0, total: 0 };
                            acc[name].quantity += item.quantity;
                            acc[name].total += item.price_at_time * item.quantity;
                            return acc;
                          }, {})
                        ).map((g: any) => (
                          <div key={g.name} className="flex justify-between text-sm text-slate-400">
                            <span>{g.quantity}× {g.name}</span>
                            <span>R$ {g.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-1">
                          {orderTxs.map((tx: any, i: number) => (
                            <span key={i} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodColor[tx.method] || 'bg-slate-700 text-slate-300'}`}>
                              {methodLabel[tx.method] || tx.method} R$ {Number(tx.amount).toFixed(2)}
                            </span>
                          ))}
                        </div>
                        {taxa > 0 && (
                          <span className="text-xs text-amber-400 font-medium whitespace-nowrap ml-2">Taxa R$ {taxa.toFixed(2)}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 text-right">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center text-sm">
                <div><p className="text-slate-500 text-xs mb-1">Comandas Pagas</p><p className="font-bold text-white">{sessionOrders.length}</p></div>
                <div><p className="text-slate-500 text-xs mb-1">Produtos Vendidos</p><p className="font-bold text-white">R$ {sessionGross.toFixed(2)}</p></div>
                <div><p className="text-slate-500 text-xs mb-1">Valor Líquido</p><p className="font-bold text-emerald-400">R$ {sessionNet.toFixed(2)}</p></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Order Details Modal */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Pedido #{viewDetailsOrder.pulseira}</h3>
                <p className="text-slate-400">{viewDetailsOrder.customer_name}</p>
                <p className="text-xs text-slate-500 mt-1">Status: {viewDetailsOrder.status === 'paid' ? `Fechado em: ${new Date(viewDetailsOrder.closed_at || viewDetailsOrder.created_at).toLocaleString()}` : 'Aberto'}</p>
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="text-slate-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {viewDetailsOrder.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-200">{item.products?.name || `Produto #${item.product_id}`}</p>
                    <p className="text-xs text-slate-500">{item.quantity}x R$ {item.price_at_time?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-300">R$ {(item.quantity * item.price_at_time).toFixed(2)}</p>
                    {viewDetailsOrder.status !== 'paid' && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Remover "${item.product_name}" da comanda?`)) return;
                          try {
                            await api.removeOrderItem(viewDetailsOrder.id, item.id);
                            const updated = await api.getOrder(viewDetailsOrder.pulseira);
                            setViewDetailsOrder(updated);
                            loadData();
                          } catch (e) { alert('Erro ao remover item'); }
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!viewDetailsOrder.items || viewDetailsOrder.items.length === 0) && <p className="text-center text-slate-500 py-4">Nenhum item neste pedido.</p>}
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-4 text-lg">
                <span className="text-slate-400">Total</span>
                <span className="font-bold text-emerald-400">R$ {totalViewDetails.toFixed(2)}</span>
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed History Drill-down Modal */}
      {drillDownModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  {drillDownModal.type === 'day' && 'Detalhes do Dia'}
                  {drillDownModal.type === 'gross' && 'Vendas Brutas (Itens)'}
                  {drillDownModal.type === 'cmv' && 'Custo de Mercadoria (CMV)'}
                  {drillDownModal.type === 'net' && 'Fluxo Financeiro'}
                </h3>
                <p className="text-slate-400 text-sm font-medium">{drillDownModal.date}</p>
              </div>
              <button 
                onClick={() => setDrillDownModal(null)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {drillDownModal.type === 'day' && (
                <div className="space-y-3">
                  {drillDownModal.data
                    .filter((order: any) => (order.items?.reduce((acc: number, i: any) => acc + (i.price_at_time * (i.quantity || 0)), 0) || 0) > 0)
                    .map((order: any) => (
                    <div key={order.id} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center hover:bg-slate-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-bold">#{order.pulseira}</span>
                            <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-400">Garçom: <span className="text-blue-400">{order.waiter?.name || 'Sistema'}</span></p>
                      </div>
                      <span className="text-lg font-bold text-emerald-400">R$ {order.items?.reduce((acc: number, i: any) => acc + (i.price_at_time * (i.quantity || 0)), 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {drillDownModal.data.filter((order: any) => (order.items?.reduce((acc: number, i: any) => acc + (i.price_at_time * (i.quantity || 0)), 0) || 0) > 0).length === 0 && <p className="text-center py-10 text-slate-500">Nenhum registro encontrado.</p>}
                </div>
              )}

              {drillDownModal.type === 'gross' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="py-2 pb-4">Item</th>
                        <th className="py-2 pb-4 text-center">Qtd Total</th>
                        <th className="py-2 pb-4 text-right">Vlr. Unitário</th>
                        <th className="py-2 pb-4 text-right">Faturamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {Object.values(drillDownModal.data.reduce((acc: any, item: any) => {
                        const name = item.products?.name || `ID ${item.product_id}`;
                        if (!acc[name]) acc[name] = { name, quantity: 0, total: 0, price: item.price_at_time };
                        acc[name].quantity += Number(item.quantity || 0);
                        acc[name].total += Number(item.quantity || 0) * Number(item.price_at_time || 0);
                        return acc;
                      }, {})).sort((a: any, b: any) => b.total - a.total).map((group: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 text-slate-200 font-medium">{group.name}</td>
                          <td className="py-3 text-center font-bold text-blue-400">{group.quantity}</td>
                          <td className="py-3 text-right text-slate-400">R$ {Number(group.price || 0).toFixed(2)}</td>
                          <td className="py-3 text-right font-bold text-emerald-400">R$ {group.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {drillDownModal.type === 'cmv' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="py-2 pb-4">Item</th>
                        <th className="py-2 pb-4 text-center">Qtd Total</th>
                        <th className="py-2 pb-4 text-right">Custo Unit.</th>
                        <th className="py-2 pb-4 text-right">Custo Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {Object.values(drillDownModal.data.reduce((acc: any, item: any) => {
                        const name = item.products?.name || `ID ${item.product_id}`;
                        if (!acc[name]) acc[name] = { name, quantity: 0, total: 0, cost: item.cost_at_time || 0 };
                        acc[name].quantity += Number(item.quantity || 0);
                        acc[name].total += Number(item.quantity || 0) * Number(item.cost_at_time || 0);
                        return acc;
                      }, {})).sort((a: any, b: any) => b.total - a.total).map((group: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 text-slate-200 font-medium">{group.name}</td>
                          <td className="py-3 text-center font-bold text-blue-400">{group.quantity}</td>
                          <td className="py-3 text-right text-slate-400">R$ {Number(group.cost || 0).toFixed(2)}</td>
                          <td className="py-3 text-right font-bold text-amber-500">R$ {group.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {drillDownModal.type === 'net' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {['cash', 'debit', 'credit', 'pix'].map((method: any) => {
                       const amount = drillDownModal.data.transactions
                         .filter((t: any) => t.method === method || (method === 'credit' && t.method === 'card'))
                         .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
                       const label = method === 'pix' ? 'PIX' : method === 'debit' ? 'Débito' : method === 'credit' ? 'Crédito' : 'Dinheiro';
                       return (
                         <div key={method} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                           <p className="text-slate-500 text-xs uppercase font-bold mb-1">{label}</p>
                           <p className="text-xl font-bold text-white">R$ {amount.toFixed(2)}</p>
                         </div>
                       );
                     })}
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                     <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Resumo Financeiro</p>
                     <div className="flex justify-between items-center text-slate-300">
                        <span className="text-sm">Total de Entradas:</span>
                        <span className="font-bold text-emerald-400">R$ {drillDownModal.data.transactions.reduce((acc: number, t:any) => acc + Number(t.amount || 0), 0).toFixed(2)}</span>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end text-right">
              <button 
                onClick={() => setDrillDownModal(null)} 
                className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
              >
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
  const [fixedCustomers, setFixedCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // History State
  const [historyTarget, setHistoryTarget] = useState<{type: 'employee' | 'customer', id: any, name: string} | null>(null);
  const [historyData, setHistoryData] = useState<{orders: any[], transactions: any[]}>({orders: [], transactions: []});
  const [historyPeriod, setHistoryPeriod] = useState<'today' | 'month' | 'custom'>('today');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empData, custData] = await Promise.all([
        api.getEmployees(),
        api.getFixedCustomers()
      ]);
      setEmployees(empData);
      setFixedCustomers(custData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async (target: {type: 'employee' | 'customer', id: any}, period: string, start?: string, end?: string) => {
    setIsHistoryLoading(true);
    try {
      let isoStart: string | undefined;
      let isoEnd: string | undefined;
      const now = new Date();
      
      if (period === 'today') {
        const d = new Date(now);
        d.setHours(0,0,0,0);
        isoStart = d.toISOString();
      } else if (period === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        isoStart = d.toISOString();
      } else if (period === 'custom') {
        if (start) {
          const d = new Date(start);
          const userOffset = d.getTimezoneOffset() * 60000;
          isoStart = new Date(d.getTime() + userOffset).toISOString();
        }
        if (end) {
          const d = new Date(end);
          const userOffset = d.getTimezoneOffset() * 60000;
          d.setTime(d.getTime() + userOffset);
          d.setHours(23,59,59,999);
          isoEnd = d.toISOString();
        }
      }
      
      const res = target.type === 'employee' 
        ? await api.getEmployeeHistory(target.id, isoStart, isoEnd)
        : await api.getCustomerHistory(target.id, isoStart, isoEnd);
      setHistoryData(res);
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar histórico');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openHistory = (target: any, type: 'employee' | 'customer') => {
    setHistoryTarget({ type, id: target.id, name: target.name });
    setHistoryPeriod('today');
    loadHistory({ type, id: target.id }, 'today');
  };

  useEffect(() => {
    if (historyTarget) {
      loadHistory({ type: historyTarget.type, id: historyTarget.id }, historyPeriod, historyStartDate, historyEndDate);
    }
  }, [historyPeriod, historyStartDate, historyEndDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const role = formData.get('role') as string;
    const isLoginRole = role === 'admin' || role === 'waiter';

    // Auto-generate a random 6 digit PIN if not provided
    let pin = isLoginRole ? formData.get('pin') as string : null;
    if (isLoginRole && !pin) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const data = {
      id: editingEmployee?.id,
      name: formData.get('name'),
      role: role,
      pin: pin,
      active: formData.get('active') === 'true',
      fixed_pulseira: formData.get('fixed_pulseira'),
      discount_percentage: Number(formData.get('discount_percentage') || 0),
      discount_cap: Number(formData.get('discount_cap') || 0),
    };

    try {
      await api.saveEmployee(data);
      setIsModalOpen(false);
      setEditingEmployee(null);
      loadData();
      if (!editingEmployee && isLoginRole) {
        alert(`Funcionário salvo com sucesso!\nO PIN de acesso é: ${pin}\n(Anote este PIN e entregue ao funcionário)`);
      } else {
        alert('Funcionário atualizado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Pulseira Fixa')) {
        alert(err.message);
      } else if (err.message?.includes('unique constraint')) {
        alert('Este PIN já está em uso por outro funcionário. Tente outro.');
      } else {
        alert('Erro ao salvar funcionário.');
      }
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      fixed_pulseira: formData.get('fixed_pulseira') || null,
    };

    try {
      if (editingCustomer?.id) {
        await api.saveCustomer({ ...data, id: editingCustomer.id });
        alert('Cliente atualizado com sucesso!');
      } else {
        await api.createCustomer(data);
        alert('Cliente cadastrado com sucesso!');
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente');
    }
  };

  const handleUnfixCustomer = async (customerId: number) => {
     if (!confirm('Deseja realmente remover a pulseira fixa deste cliente?')) return;
     try {
       await api.unfixPulseira('customer', customerId);
       loadData();
     } catch (e) {
       alert('Erro ao desvincular pulseira');
     }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este funcionário?')) return;
    try {
      await api.deleteEmployee(id);
      loadData();
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
              <th className="px-6 py-4 text-center">Pulseira Fixa</th>
              <th className="px-6 py-4 text-center">Desconto</th>
              <th className="px-6 py-4">PIN</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{emp.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    emp.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 
                    emp.role === 'waiter' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {emp.role === 'admin' ? 'Gerente' : 
                     emp.role === 'waiter' ? 'Cargo' :
                     emp.role === 'employee' ? 'Funcionário' : emp.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-mono text-blue-400 font-bold">{emp.fixed_pulseira || '-'}</td>
                <td className="px-6 py-4 text-center">
                   {emp.discount_percentage ? (
                     <div className="flex flex-col items-center">
                       <span className="text-emerald-400 font-bold">{emp.discount_percentage}%</span>
                       <span className="text-[10px] text-slate-500">Teto R$ {emp.discount_cap}</span>
                     </div>
                   ) : '-'}
                </td>
                <td className="px-6 py-4 text-center font-mono text-slate-400 tracking-widest">{emp.pin || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`flex items-center justify-center gap-1 text-xs font-bold ${emp.active ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${emp.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {emp.active ? 'Ativo' : 'Bloq'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => openHistory(emp, 'employee')}
                    className="text-amber-400 hover:text-amber-300 p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Histórico de Vendas"
                  >
                    <ClipboardList size={16} />
                  </button>
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
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Nenhum funcionário cadastrado. Utilize o script SQL para adicionar o Admin Padrão.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Customers Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
           <div>
             <h2 className="text-xl font-bold flex items-center gap-2">
               <ShoppingCart className="text-emerald-400" /> Clientes com Pulseira Fixa
             </h2>
             <p className="text-sm text-slate-500">Clientes recorrentes vinculados a números permanentes.</p>
           </div>
           <button
             onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
             className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
           >
             <Plus size={18} />
             Novo Cliente
           </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4 text-center">Pulseira Reservada</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fixedCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{cust.name}</td>
                  <td className="px-6 py-4 text-slate-400">{cust.phone || '-'}</td>
                  <td className="px-6 py-4 text-center font-mono text-emerald-400 font-bold">{cust.fixed_pulseira}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openHistory(cust, 'customer')}
                      className="text-amber-400 hover:text-amber-300 p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Histórico de Consumo"
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button
                      onClick={() => { setEditingCustomer(cust); setIsCustomerModalOpen(true); }}
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleUnfixCustomer(cust.id)}
                      className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Desvincular Pulseira"
                    >
                      <XCircle size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {fixedCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-600 italic">Nenhum cliente com pulseira fixa no momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <select 
                  name="role" 
                  defaultValue={editingEmployee?.role || 'waiter'} 
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditingEmployee(prev => ({ ...prev, role: newRole }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
                >
                  <option value="waiter">Cargo</option>
                  <option value="admin">Gerente</option>
                  <option value="employee">Funcionário</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">PIN (Vazio = Bloqueado)</label>
                <input name="pin" defaultValue={editingEmployee?.pin} minLength={6} maxLength={6} pattern="\d{6}" placeholder="Ex: 123456" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status de Acesso</label>
                <select name="active" defaultValue={editingEmployee?.active !== false ? 'true' : 'false'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200">
                  <option value="true">Conta Ativa (Pode logar)</option>
                  <option value="false">Conta Bloqueada</option>
                </select>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800">
                 <h4 className="text-xs font-bold text-blue-400 uppercase tracking-tighter mb-3">Reserva e Descontos</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pulseira Fixa</label>
                      <input name="fixed_pulseira" defaultValue={editingEmployee?.fixed_pulseira} maxLength={4} placeholder="Ex: 9975" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desconto (%)</label>
                      <input name="discount_percentage" type="number" step="0.01" defaultValue={editingEmployee?.discount_percentage || 0} placeholder="%" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                 </div>
                 <div className="mt-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teto de Valor para Desconto (R$)</label>
                    <input name="discount_cap" type="number" step="0.01" defaultValue={editingEmployee?.discount_cap || 0} placeholder="Ex: 50.00" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    <p className="text-[11px] text-slate-500 mt-1 italic leading-tight">O desconto será aplicado apenas até este valor de consumo bruto. O excesso paga valor cheio.</p>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                <input name="name" defaultValue={editingCustomer?.name} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Telefone</label>
                <input name="phone" defaultValue={editingCustomer?.phone} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Pulseira Reservada</label>
                <input name="fixed_pulseira" defaultValue={editingCustomer?.fixed_pulseira} maxLength={4} placeholder="Ex: 0042" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-emerald-500/20">
                  {editingCustomer ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ClipboardList className="text-blue-400" /> Histórico de: {historyTarget.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {historyTarget.type === 'employee' 
                    ? 'Acompanhe as vendas e pagamentos processados por este usuário.'
                    : 'Acompanhe as comandas e consumo deste cliente.'}
                </p>
              </div>
              <button 
                onClick={() => setHistoryTarget(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-slate-800 flex flex-wrap gap-4 items-center bg-slate-900">
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setHistoryPeriod('today')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'today' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setHistoryPeriod('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Este Mês
                </button>
                <button 
                  onClick={() => setHistoryPeriod('custom')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${historyPeriod === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Personalizado
                </button>
              </div>

              {historyPeriod === 'custom' && (
                <div className="flex gap-2 items-center">
                  <input 
                    type="date"
                    value={historyStartDate}
                    onChange={e => setHistoryStartDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span className="text-slate-500">até</span>
                  <input 
                    type="date"
                    value={historyEndDate}
                    onChange={e => setHistoryEndDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
              {isHistoryLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-sm text-slate-400 font-medium">Total Recebido</p>
                      <h4 className="text-2xl font-bold text-emerald-400 mt-1">
                        R$ {historyData.transactions.reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{historyData.transactions.length} pagamentos processados</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-sm text-slate-400 font-medium">Comandas Abertas</p>
                      <h4 className="text-2xl font-bold text-blue-400 mt-1">
                        {historyData.orders.length} comandas
                      </h4>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                      <h4 className="font-bold text-slate-200">Pagamentos Processados pelo Funcionário</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                          <tr>
                            <th className="px-4 py-3">Comanda</th>
                            <th className="px-4 py-3">Data/Hora</th>
                            <th className="px-4 py-3">Método</th>
                            <th className="px-4 py-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {historyData.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Nenhum pagamento registrado no período.</td>
                            </tr>
                          ) : historyData.transactions.map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3 font-medium text-slate-300">#{t.order?.pulseira || t.order_id} {t.order?.customer_name ? `- ${t.order.customer_name}` : ''}</td>
                              <td className="px-4 py-3 text-slate-400">{new Date(t.created_at).toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                <span className="uppercase text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">{t.method}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-400 font-medium">R$ {Number(t.amount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                      <h4 className="font-bold text-slate-200">Comandas Abertas pelo Funcionário</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                          <tr>
                            <th className="px-4 py-3">Comanda</th>
                            <th className="px-4 py-3">Data Abertura</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {historyData.orders.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Nenhuma comanda aberta no período.</td>
                            </tr>
                          ) : historyData.orders.map((o, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3 font-medium text-slate-300">#{o.pulseira || o.id}</td>
                              <td className="px-4 py-3 text-slate-400">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3 text-slate-300">{o.customer_name || 'Sem nome'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${o.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {o.status === 'open' ? 'Aberta' : 'Paga/Fechada'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [unselectedCategories, setUnselectedCategories] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [stockVariations, setStockVariations] = useState<{ id: string, qty: number, size: number, totalPrice: number }[]>([]);
  const [purchaseUnit, setPurchaseUnit] = useState('');
  const [saleUnit, setSaleUnit] = useState('un');
  const [editingPrice, setEditingPrice] = useState<{ id: number; field: 'price' | 'cost_price'; value: string } | null>(null);

  const saveInlinePrice = async (product: any, field: 'price' | 'cost_price', rawValue: string) => {
    setEditingPrice(null);
    const value = parseFloat(rawValue) || 0;
    if (value === (product[field] || 0)) return;
    await api.saveProduct({ ...product, [field]: value });
    const allProducts = await api.getProducts();
    setProducts(allProducts);
    if (field === 'cost_price') {
      const compositions = allProducts.filter((p: any) =>
        p.type === 'composition' &&
        (p.ingredients || []).some((ing: any) => ing.ingredient_id === product.id)
      );
      if (compositions.length > 0) {
        for (const comp of compositions) {
          const newCost = (comp.ingredients || []).reduce((sum: number, ing: any) => {
            const ingProd = allProducts.find((p: any) => p.id === ing.ingredient_id);
            const unitCost = ing.ingredient_id === product.id ? value : (ingProd?.cost_price || 0);
            const qty = ing.quantity || 0;
            return sum + unitCost * qty;
          }, 0);
          await api.saveProduct({ ...comp, cost_price: parseFloat(newCost.toFixed(2)) });
        }
        api.getProducts().then(setProducts);
      }
    }
  };

  const exportProductsToExcel = () => {
    // Collect all products including variations if possible
    const exportData = products.map(p => ({
      ID: p.id,
      Nome: p.name,
      Tipo: p.type === 'variable' ? 'Variável' : (p.type === 'composition' ? 'Composição' : 'Simples'),
      Categoria: categories.find(c => c.id === p.category_id)?.name || '',
      Preço: p.price || 0,
      'Preço de Custo': p.cost_price || 0,
      Estoque: p.stock || 0,
      Unidade: p.unit || 'un',
      Ativo: p.active ? 'S' : 'N'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    
    // Set column widths
    const wscols = [
      { wch: 6 },  // ID
      { wch: 30 }, // Nome
      { wch: 12 }, // Tipo
      { wch: 20 }, // Categoria
      { wch: 10 }, // Preço
      { wch: 12 }, // Custo
      { wch: 10 }, // Estoque
      { wch: 8 },  // Unid
      { wch: 6 }   // Ativo
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Baragem_Produtos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('Arquivo vazio!');
          setIsImporting(false);
          return;
        }

        const categoryMap = new Map();
        categories.forEach(c => categoryMap.set(c.name.toLowerCase().trim(), c.id));

        let successCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          // Basic validation
          if (!row.Nome) continue;

          const productData: any = {
            name: row.Nome,
            price: parseFloat(row.Preço) || 0,
            cost_price: parseFloat(row['Preço de Custo'] || row.Custo) || 0,
            stock: parseFloat(row.Estoque) || 0,
            unit: row.Unidade || 'un',
            active: row.Ativo === 'S' || row.Ativo === 'Sim' || row.Ativo === true,
            type: row.Tipo === 'Variável' ? 'variable' : (row.Tipo === 'Composição' ? 'composition' : 'simple'),
            category_id: categoryMap.get(String(row.Categoria || '').toLowerCase().trim()) || categories[0]?.id
          };

          if (row.ID) {
            productData.id = row.ID;
          }

          try {
            await api.saveProduct(productData);
            successCount++;
          } catch (err) {
            console.error(`Erro ao importar ${row.Nome}:`, err);
            errorCount++;
          }
        }
        
        loadProducts();
        alert(`Importação concluída!\nSucessos: ${successCount}\nErros: ${errorCount}`);
      } catch (err) {
        console.error('Erro na leitura do arquivo:', err);
        alert('Erro ao processar o arquivo Excel.');
      } finally {
        setIsImporting(false);
        // Clear input
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };
  
  // Sorting State
  const [sortField, setSortField] = useState<'name' | 'type' | 'category' | 'cost_price' | 'price' | 'margin' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'type' | 'category' | 'cost_price' | 'price' | 'margin' | 'stock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setProductType(editingProduct.type || 'simple');
      setIngredients(editingProduct.ingredients || []);
      setChildProducts(products.filter(p => p.parent_id === editingProduct.id).map(p => p.id));
      setStockVariations(editingProduct.batches?.map((b: any) => ({
        id: b.id.toString(),
        qty: parseFloat(b.quantity) || 0,
        size: parseFloat(b.unit_size) || 1,
        totalPrice: parseFloat(b.total_price) || 0
      })) || []);
      setModifierGroups(editingProduct.modifier_groups || []);
    } else {
      setProductType('simple');
      setIngredients([]);
      setChildProducts([]);
      setStockVariations([]);
      setModifierGroups([]);
    }
  }, [editingProduct, products]);

  // Automate calculator updates to main form fields
  useEffect(() => {
    if (stockVariations.length > 0) {
      const totalStock = stockVariations.reduce((sum, v) => sum + (v.qty * v.size), 0);
      const totalPrice = stockVariations.reduce((sum, v) => sum + v.totalPrice, 0);
      const avgCost = totalStock > 0 ? (totalPrice / totalStock) : 0;

      // Update the main form fields in the DOM
      const stockInput = document.querySelector('input[name="stock"]') as HTMLInputElement;
      const costInput = document.querySelector('input[name="cost_price"]') as HTMLInputElement;

      if (stockInput) stockInput.value = totalStock.toString();
      if (costInput) costInput.value = avgCost.toFixed(2);
    }
  }, [stockVariations]);

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

    // Handle parent_id from form (allows moving any product to a variable)
    const formParentId = formData.get('parent_id');
    if (formParentId && formParentId !== '') {
      data.parent_id = parseInt(formParentId as string);
    } else {
      data.parent_id = null;
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
      data.batches = stockVariations;

      // Garrafa: volume apenas
      const selectedCat = categories.find(c => c.id === data.category_id);
      if (selectedCat?.name === 'Garrafa') {
        data.bottle_volume_ml = parseFloat(formData.get('bottle_volume_ml') as string) || 0;
      }
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

    data.modifier_groups = modifierGroups;

    try {
      console.log('Saving product data:', JSON.stringify(data, null, 2));
      await api.saveProduct(data);
      setIsModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      console.error('Product save error:', err);
      alert(`Erro ao salvar produto: ${err?.message || JSON.stringify(err)}`);
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

  const addModifierGroup = () => {
    setModifierGroups([...modifierGroups, { 
      name: '', 
      step_order: modifierGroups.length + 1, 
      min_select: 1, 
      max_select: 1, 
      product_modifier_items: [] 
    }]);
  };

  const removeModifierGroup = (index: number) => {
    setModifierGroups(modifierGroups.filter((_, i) => i !== index));
  };

  const updateModifierGroup = (index: number, field: string, value: any) => {
    const newGroups = [...modifierGroups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setModifierGroups(newGroups);
  };

  const addModifierItem = (groupIndex: number) => {
    const newGroups = [...modifierGroups];
    const items = [...(newGroups[groupIndex].product_modifier_items || [])];
    items.push({ linked_product_id: '', is_fixed_price: false, extra_price: 0 });
    newGroups[groupIndex].product_modifier_items = items;
    setModifierGroups(newGroups);
  };

  const removeModifierItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...modifierGroups];
    newGroups[groupIndex].product_modifier_items = newGroups[groupIndex].product_modifier_items.filter((_: any, i: number) => i !== itemIndex);
    setModifierGroups(newGroups);
  };

  const updateModifierItem = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    const newGroups = [...modifierGroups];
    const items = [...newGroups[groupIndex].product_modifier_items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    newGroups[groupIndex].product_modifier_items = items;
    setModifierGroups(newGroups);
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

  // Helper to get products selectable for ingredients or variations (Simple and Composition)
  const selectableProducts = products.filter(p => (p.type === 'simple' || p.type === 'composition') && p.id !== editingProduct?.id);

  // Helper to get parent products for variations (if we were implementing that here, but for now we just create the parent)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
        <div className="flex gap-2">
          <button
            onClick={exportProductsToExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
            title="Exportar para Excel"
          >
            <Download size={18} /> 📥 Exportar
          </button>
          
          <label className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer">
            <Upload size={18} />
            <span>{isImporting ? 'Importando...' : '📤 Importar'}</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImportExcel} 
              className="hidden" 
              disabled={isImporting}
            />
          </label>

          <button
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar produto, variação ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-sm font-medium text-slate-400 mb-3">Filtrar por Categoria:</p>
        <div className="flex flex-wrap gap-3">
          {categories.filter(c => !c.parent_id).map(cat => {
            const isSelected = !unselectedCategories.includes(cat.id);
            return (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      setUnselectedCategories([...unselectedCategories, cat.id]);
                    } else {
                      setUnselectedCategories(unselectedCategories.filter(id => id !== cat.id));
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-200">{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">PRODUTO {sortField === 'name' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('type')}>
                <div className="flex items-center gap-1">TIPO {sortField === 'type' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1">CATEGORIA {sortField === 'category' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('cost_price')}>
                <div className="flex items-center gap-1">CUSTO {sortField === 'cost_price' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1">PREÇO {sortField === 'price' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('margin')}>
                <div className="flex items-center gap-1">LUCRO % {sortField === 'margin' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1">ESTOQUE {sortField === 'stock' && <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
              </th>
              <th className="px-6 py-4 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.filter(p => {
              if (p.parent_id) return false;
              
              // Filter by unselected categories (including their children)
              const disabledCategoryIds = unselectedCategories;
              const disabledChildIds = categories.filter(c => c.parent_id && disabledCategoryIds.includes(c.parent_id)).map(c => c.id);
              const allDisabledIds = [...disabledCategoryIds, ...disabledChildIds];
              
              if (p.category_id && allDisabledIds.includes(p.category_id)) {
                return false;
              }

              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = p.name?.toLowerCase().includes(term) || false;
                const matchesCat = p.category_name?.toLowerCase().includes(term) || false;
                // Also check if any child product matches!
                const hasMatchingChild = products.some(child => child.parent_id === p.id && child.name?.toLowerCase().includes(term));
                return matchesName || matchesCat || hasMatchingChild;
              }
              return true;
            }).sort((a, b) => {
              const dir = sortDirection === 'asc' ? 1 : -1;
              if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * dir;
              if (sortField === 'type') return (a.type || '').localeCompare(b.type || '') * dir;
              if (sortField === 'category') return (a.category_name || '').localeCompare(b.category_name || '') * dir;
              if (sortField === 'cost_price') return ((a.cost_price || 0) - (b.cost_price || 0)) * dir;
              if (sortField === 'price') return ((a.price || 0) - (b.price || 0)) * dir;
              if (sortField === 'margin') {
                const ma = a.price > 0 && a.cost_price > 0 ? ((a.price - a.cost_price) / a.price) * 100 : -1;
                const mb = b.price > 0 && b.cost_price > 0 ? ((b.price - b.cost_price) / b.price) * 100 : -1;
                return (ma - mb) * dir;
              }
              if (sortField === 'stock') return ((a.stock || 0) - (b.stock || 0)) * dir;
              return 0;
            }).map(product => (
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
                  {/* CUSTO */}
                  <td className="px-4 py-4">
                    {product.type === 'variable' ? <span className="text-slate-500">—</span> :
                      editingPrice?.id === product.id && editingPrice.field === 'cost_price' ? (
                        <input autoFocus type="number" min="0" step="0.01" value={editingPrice.value}
                          onChange={e => { const v = e.target.value; const parts = v.split('.'); const clamped = parts[1]?.length > 2 ? parseFloat(v).toFixed(2) : v; setEditingPrice(p => p && { ...p, value: clamped }); }}
                          onBlur={() => saveInlinePrice(product, 'cost_price', editingPrice.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(product, 'cost_price', editingPrice.value); if (e.key === 'Escape') setEditingPrice(null); }}
                          className="w-24 bg-slate-700 border border-amber-500 rounded px-2 py-0.5 text-amber-400 text-sm font-bold outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => product.type !== 'composition' ? setEditingPrice({ id: product.id, field: 'cost_price', value: (product.cost_price || 0).toFixed(2) }) : undefined}
                          className={`text-sm font-medium ${product.type === 'composition' ? 'text-slate-500 cursor-default' : 'text-amber-400 hover:underline'}`}
                          title={product.type === 'composition' ? 'Calculado automaticamente' : 'Clique para editar'}
                        >R$ {(product.cost_price || 0).toFixed(2)}</button>
                      )
                    }
                  </td>
                  {/* PREÇO */}
                  <td className="px-4 py-4">
                    {product.type === 'variable' ? <span className="text-slate-500">—</span> :
                      editingPrice?.id === product.id && editingPrice.field === 'price' ? (
                        <input autoFocus type="number" min="0" step="0.01" value={editingPrice.value}
                          onChange={e => { const v = e.target.value; const parts = v.split('.'); const clamped = parts[1]?.length > 2 ? parseFloat(v).toFixed(2) : v; setEditingPrice(p => p && { ...p, value: clamped }); }}
                          onBlur={() => saveInlinePrice(product, 'price', editingPrice.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(product, 'price', editingPrice.value); if (e.key === 'Escape') setEditingPrice(null); }}
                          className="w-24 bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-emerald-400 text-sm font-bold outline-none"
                        />
                      ) : (
                        <button onClick={() => setEditingPrice({ id: product.id, field: 'price', value: (product.price || 0).toFixed(2) })}
                          className="text-emerald-400 text-sm font-medium hover:underline">
                          R$ {(product.price || 0).toFixed(2)}
                        </button>
                      )
                    }
                  </td>
                  {/* LUCRO % */}
                  <td className="px-4 py-4">
                    {product.type === 'variable' ? <span className="text-slate-500">—</span> : (() => {
                      const p = product.price || 0; const c = product.cost_price || 0;
                      if (p <= 0 || c <= 0) return <span className="text-slate-500 text-sm">—</span>;
                      const m = ((p - c) / p) * 100;
                      return <span className={`px-2 py-1 rounded text-xs font-bold ${m >= 50 ? 'bg-emerald-500/20 text-emerald-400' : m >= 30 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{m.toFixed(1)}%</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {product.type === 'variable' ? (
                      <span className="text-slate-500">-</span>
                    ) : product.type === 'composition' ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {product.stock} disp.
                      </span>
                    ) : product.category_name === 'Garrafa' ? (
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${Math.floor(product.stock || 0) <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {Math.floor(product.stock || 0)} Fechadas
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${Math.round(((product.stock || 0) % 1) * (product.bottle_volume_ml || 1000)) <= 200 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {Math.round(((product.stock || 0) % 1) * (product.bottle_volume_ml || 1000))}ml aberto
                        </span>
                      </div>
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
                    {/* CUSTO variação */}
                    <td className="px-4 py-4">
                      {editingPrice?.id === variation.id && editingPrice.field === 'cost_price' ? (
                        <input autoFocus type="number" min="0" step="0.01" value={editingPrice.value}
                          onChange={e => { const v = e.target.value; const parts = v.split('.'); const clamped = parts[1]?.length > 2 ? parseFloat(v).toFixed(2) : v; setEditingPrice(p => p && { ...p, value: clamped }); }}
                          onBlur={() => saveInlinePrice(variation, 'cost_price', editingPrice.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(variation, 'cost_price', editingPrice.value); if (e.key === 'Escape') setEditingPrice(null); }}
                          className="w-24 bg-slate-700 border border-amber-500 rounded px-2 py-0.5 text-amber-400 text-sm font-bold outline-none"
                        />
                      ) : (
                        <button onClick={() => setEditingPrice({ id: variation.id, field: 'cost_price', value: (variation.cost_price || 0).toFixed(2) })}
                          className="text-amber-400 text-sm font-medium hover:underline">
                          R$ {(variation.cost_price || 0).toFixed(2)}
                        </button>
                      )}
                    </td>
                    {/* PREÇO variação */}
                    <td className="px-4 py-4">
                      {editingPrice?.id === variation.id && editingPrice.field === 'price' ? (
                        <input autoFocus type="number" min="0" step="0.01" value={editingPrice.value}
                          onChange={e => { const v = e.target.value; const parts = v.split('.'); const clamped = parts[1]?.length > 2 ? parseFloat(v).toFixed(2) : v; setEditingPrice(p => p && { ...p, value: clamped }); }}
                          onBlur={() => saveInlinePrice(variation, 'price', editingPrice.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(variation, 'price', editingPrice.value); if (e.key === 'Escape') setEditingPrice(null); }}
                          className="w-24 bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-emerald-400 text-sm font-bold outline-none"
                        />
                      ) : (
                        <button onClick={() => setEditingPrice({ id: variation.id, field: 'price', value: (variation.price || 0).toFixed(2) })}
                          className="text-emerald-400 text-sm font-medium hover:underline">
                          R$ {(variation.price || 0).toFixed(2)}
                        </button>
                      )}
                    </td>
                    {/* LUCRO % variação */}
                    <td className="px-4 py-4">
                      {(() => {
                        const p = variation.price || 0; const c = variation.cost_price || 0;
                        if (p <= 0 || c <= 0) return <span className="text-slate-500 text-sm">—</span>;
                        const m = ((p - c) / p) * 100;
                        return <span className={`px-2 py-1 rounded text-xs font-bold ${m >= 50 ? 'bg-emerald-500/20 text-emerald-400' : m >= 30 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{m.toFixed(1)}%</span>;
                      })()}
                    </td>
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
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required onInput={e => { const el = e.target as HTMLInputElement; const p = el.value.split('.'); if (p[1]?.length > 2) el.value = parseFloat(el.value).toFixed(2); }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Preço Custo (R$)</label>
                    <input name="cost_price" type="number" step="0.01" defaultValue={editingProduct?.cost_price} onInput={e => { const el = e.target as HTMLInputElement; const p = el.value.split('.'); if (p[1]?.length > 2) el.value = parseFloat(el.value).toFixed(2); }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  {productType === 'simple' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Estoque</label>
                        <input name="stock" type="number" step="0.001" defaultValue={editingProduct?.stock} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Unidade</label>
                        <select 
                          name="unit" 
                          value={saleUnit} 
                          onChange={(e) => setSaleUnit(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="un">Unidade (un)</option>
                          <option value="Garrafa">Garrafa</option>
                          <option value="Pacote">Pacote</option>
                          <option value="Lata">Lata</option>
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

              {/* Stock Calculator for Simple Products (Spreadsheet style) */}
              {productType === 'simple' && (
                <div className="mt-6 border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/40">
                  <div className="p-3 bg-slate-800/60 border-b border-slate-700 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                       <Calculator size={14} className="text-blue-400" /> Calculadora de Entradas / Compras
                    </h4>
                    <button
                      type="button"
                      onClick={() => setStockVariations([...stockVariations, { id: Math.random().toString(), qty: 1, size: 1, totalPrice: 0 }])}
                      className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/30 flex items-center gap-1"
                    >
                      <Plus size={12} /> Adicionar Lote
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-800/30 text-slate-500 border-b border-slate-800">
                          <th className="px-3 py-2 font-medium">Qtd (Pcts/Garrafas)</th>
                          <th className="px-3 py-2 font-medium">Unidade (kg, Litro, etc)</th>
                          <th className="px-3 py-2 font-medium">Preço Pago (Total)</th>
                          <th className="px-3 py-2 font-medium">Custo p/ Unidade</th>
                          <th className="px-1 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {stockVariations.map((v, idx) => {
                          const unitCost = (v.qty * v.size) > 0 ? (v.totalPrice / (v.qty * v.size)) : 0;
                          return (
                            <tr key={v.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={v.qty}
                                  onChange={(e) => {
                                    const newVars = [...stockVariations];
                                    newVars[idx].qty = parseFloat(e.target.value) || 0;
                                    setStockVariations(newVars);
                                  }}
                                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={v.size}
                                  onChange={(e) => {
                                    const newVars = [...stockVariations];
                                    newVars[idx].size = parseFloat(e.target.value) || 0;
                                    setStockVariations(newVars);
                                  }}
                                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.totalPrice}
                                    onChange={(e) => {
                                      const newVars = [...stockVariations];
                                      newVars[idx].totalPrice = parseFloat(e.target.value) || 0;
                                      setStockVariations(newVars);
                                    }}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md pl-7 pr-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-400 font-mono">
                                R$ {unitCost.toFixed(2)}
                              </td>
                              <td className="px-1 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setStockVariations(stockVariations.filter((_, i) => i !== idx))}
                                  className="text-red-500/50 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {stockVariations.length > 0 && (
                    <div className="p-4 bg-slate-800/20 border-t border-slate-700/50">
                      <div className="flex justify-between items-center px-2">
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Items Totais</span>
                          <span className="text-white text-lg font-bold">
                            {stockVariations.reduce((sum, v) => sum + (v.qty * v.size), 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">{saleUnit}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Custo Médio</span>
                          <span className="text-emerald-400 text-lg font-bold">
                            R$ {(stockVariations.reduce((sum, v) => sum + v.totalPrice, 0) / (stockVariations.reduce((sum, v) => sum + (v.qty * v.size), 0) || 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {stockVariations.length === 0 && (
                    <div className="p-8 text-center bg-slate-900/20">
                      <p className="text-xs text-slate-500 italic">Adicione compras ou lotes diferentes para calcular o custo médio e o estoque final.</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                <select name="category_id" defaultValue={editingProduct?.category_id} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_name ? `${formatCategoryName(cat.parent_name)} > ${formatCategoryName(cat.name)}` : formatCategoryName(cat.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Product Selector - Freedom to link any product to a variable */}
              {productType !== 'variable' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Pertence ao Produto Variável? (Pai)</label>
                  <select 
                    name="parent_id" 
                    defaultValue={editingProduct?.parent_id || ''} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Não (Produto Independente)</option>
                    {products.filter(p => p.type === 'variable' && p.id !== editingProduct?.id).map(variantParent => (
                      <option key={variantParent.id} value={variantParent.id}>
                        {variantParent.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Vincule este produto a um pai para transformá-lo em uma variação.</p>
                </div>
              )}

              {/* Bottle volume - shown when category is Garrafa */}
              {categories.find(c => c.id === (editingProduct?.category_id || categories[0]?.id))?.name === 'Garrafa' && productType === 'simple' && (
                <div className="p-3 bg-amber-900/10 border border-amber-900/30 rounded-xl space-y-3">
                  <p className="text-xs text-amber-400 font-bold uppercase">🍾 Configuração de Garrafa</p>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-400 mb-1">Volume da Garrafa (ml)</label>
                      <input name="bottle_volume_ml" type="number" step="1" defaultValue={editingProduct?.bottle_volume_ml || 1000} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ex: 750, 1000" />
                    </div>
                  </div>
                </div>
              )}

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
                          {selectableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.type === 'composition' ? 'Comp.' : `${p.stock} ${p.unit}`})
                            </option>
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
                          <option value="">Selecione um produto...</option>
                          {selectableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.type === 'composition' ? '(Composição)' : `(${p.stock} ${p.unit})`}
                            </option>
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

              {/* Modifiers Section (Wizard Steps) */}
              <div className="border-t border-slate-800 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400">Pulos Sequenciais (Wizard)</label>
                    <p className="text-[10px] text-slate-500 italic">Configure até 5 passos de escolha obrigatória.</p>
                  </div>
                  <button type="button" onClick={addModifierGroup} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-emerald-400 flex items-center gap-1">
                    <Plus size={14} /> Adicionar Passo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {modifierGroups.map((group, gIdx) => (
                    <div key={gIdx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        type="button" 
                        onClick={() => removeModifierGroup(gIdx)} 
                        className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="grid grid-cols-12 gap-3 mb-4">
                        <div className="col-span-8">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nome do Passo {gIdx + 1}</label>
                          <input 
                            type="text" 
                            value={group.name} 
                            onChange={(e) => updateModifierGroup(gIdx, 'name', e.target.value)}
                            placeholder="Ex: Escolha o Gelo"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Ordem (Pulo)</label>
                          <input 
                            type="number" 
                            value={group.step_order} 
                            onChange={(e) => updateModifierGroup(gIdx, 'step_order', parseInt(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Opções de Produtos</p>
                          <button type="button" onClick={() => addModifierItem(gIdx)} className="text-[10px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded font-bold uppercase">
                            + Item
                          </button>
                        </div>
                        
                        {group.product_modifier_items?.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex gap-2 items-center bg-slate-800/30 p-2 rounded-lg border border-slate-700/30">
                            <select
                              value={item.linked_product_id || ''}
                              onChange={(e) => updateModifierItem(gIdx, iIdx, 'linked_product_id', parseInt(e.target.value))}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                            >
                              <option value="">Selecione...</option>
                              {selectableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
                              <input 
                                type="checkbox" 
                                id={`fixed-${gIdx}-${iIdx}`}
                                checked={item.is_fixed_price} 
                                onChange={(e) => updateModifierItem(gIdx, iIdx, 'is_fixed_price', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                              />
                              <label htmlFor={`fixed-${gIdx}-${iIdx}`} className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none">Fixo (X)</label>
                            </div>

                            <button type="button" onClick={() => removeModifierItem(gIdx, iIdx)} className="text-slate-600 hover:text-red-400 p-1">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {modifierGroups.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 italic">Nenhuma sequência de passos configurada.</p>
                    </div>
                  )}
                </div>
              </div>

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  const updateStock = async (product: any, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    await api.saveProduct({ ...product, stock: newStock });
    api.getProducts().then(setProducts);
  };

  const topLevel = products.filter(p => !p.parent_id);
  const getVariants = (parentId: number) => products.filter(p => p.parent_id === parentId);

  const filtered = topLevel.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (p.name?.toLowerCase().includes(term)) return true;
    if (p.type === 'variable') return getVariants(p.id).some(v => v.name?.toLowerCase().includes(term));
    return false;
  });

  const StockControl = ({ product }: { product: any }) => {
    if (product.type === 'composition') {
      return (
        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
          Auto: {product.stock ?? 0}
        </span>
      );
    }
    const stockVal = product.stock || 0;
    const label = product.category === 'Garrafa' && product.bottle_volume_ml
      ? `${Math.floor(stockVal)} un | ${Math.round((stockVal % 1) * product.bottle_volume_ml)}ml`
      : String(stockVal);
    return (
      <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
        <button onClick={() => updateStock(product, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors font-bold text-lg">−</button>
        <span className={`font-mono font-bold px-2 text-sm min-w-[3rem] text-center ${stockVal <= 5 ? 'text-red-400' : 'text-slate-200'}`}>{label}</span>
        <button onClick={() => updateStock(product, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors font-bold text-lg">+</button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="text-blue-400" /> Controle de Estoque</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">Nenhum produto encontrado.</div>
        )}
        {filtered.map(product => {
          const variants = product.type === 'variable' ? getVariants(product.id) : [];
          return (
            <div key={product.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {/* Parent row */}
              <div className="flex justify-between items-center px-4 py-3 gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-slate-200">{product.name}</span>
                  {product.category && <span className="ml-2 text-xs text-slate-500">{product.category}</span>}
                  {product.type === 'composition' && <span className="ml-2 text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Composição</span>}
                  {product.type === 'variable' && <span className="ml-2 text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{variants.length} variações</span>}
                </div>
                {product.type !== 'variable' && <StockControl product={product} />}
              </div>
              {/* Variants */}
              {variants.length > 0 && (
                <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                  {variants.map(v => (
                    <div key={v.id} className="flex justify-between items-center px-4 py-2.5 pl-10 bg-slate-900/30 gap-3">
                      <span className="text-slate-300 text-sm font-medium">{v.name}</span>
                      <StockControl product={v} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
    fee_debit: '0',
    fee_credit: '0',
    fee_pix: '0',
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

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Taxas da Maquininha (%)</h3>
            <p className="text-xs text-slate-500 mb-4">Percentual cobrado pela operadora em cada forma de pagamento. Usado apenas para controle interno.</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Débito</label>
                <div className="relative">
                  <input
                    name="fee_debit"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.fee_debit}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Crédito</label>
                <div className="relative">
                  <input
                    name="fee_credit"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.fee_credit}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">PIX</label>
                <div className="relative">
                  <input
                    name="fee_pix"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.fee_pix}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
            </div>
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
                  <label className="block text-sm text-emerald-400 mb-1">Efetivar Qtd (Garrafas/Un)</label>
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
              {/* Bottle volume for Garrafa products */}
              {item.product_id && products.find(p => p.id === item.product_id)?.category_name === 'Garrafa' && (
                <div className="mt-3 p-3 bg-amber-900/10 border border-amber-900/30 rounded-xl">
                  <label className="block text-xs font-bold text-amber-400 mb-1">🍾 Volume da Garrafa (ml)</label>
                  <input
                    type="number" step="1" placeholder="Ex: 750, 1000"
                    value={item.bottle_volume_ml || products.find(p => p.id === item.product_id)?.bottle_volume_ml || ''}
                    onChange={(e) => {
                      const newItems = [...reconcileItems];
                      newItems[index].bottle_volume_ml = parseFloat(e.target.value) || 0;
                      setReconcileItems(newItems);
                    }}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm" />
                  <p className="text-xs text-slate-500 mt-1">Informe o volume de cada garrafa para calcular o estoque em ml.</p>
                </div>
              )}
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

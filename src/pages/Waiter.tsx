import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

import {
  Search, Plus, Minus, ShoppingCart, User, CreditCard,
  ChevronLeft, Check, X, Home, Filter, List, PlusCircle, Trash2
} from 'lucide-react';

export default function Waiter() {
  const [view, setView] = useState<'home' | 'order'>('home');
  const [pulseira, setPulseira] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConsumptionOpen, setIsConsumptionOpen] = useState(false);


  // Customer Linking State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    nickname: '',
    birthday: '',
    document: '',
    phone: ''
  });
  const [identifiedCustomer, setIdentifiedCustomer] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Unified Payment State
  const [ordersToPay, setOrdersToPay] = useState<any[]>([]);
  const [extraPulseira, setExtraPulseira] = useState('');
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [coverFee, setCoverFee] = useState(0);
  const [settings, setSettings] = useState<any>({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts);
    api.getCategories().then(setCategories);
    api.getSettings().then(setSettings);
  }, []);



  const handleEnterOrder = async () => {
    if (!pulseira) return;
    setIsLoading(true);
    try {
      const order = await api.getOrder(pulseira);
      setCurrentOrder(order);
      setView('order');
    } catch (err) {
      // Order not found, open modal to create
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formPulseira = formData.get('pulseira') as string;

    const finalPulseira = formPulseira || pulseira;

    if (!finalPulseira) {
      alert('Pulseira é obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      let customerId = identifiedCustomer?.id;
      let customerName = customerForm.name;
      let customerPhone = customerForm.phone;

      if (!customerId && customerForm.name) {
        try {
          // Attempt to create new customer
          const newCustomer = await api.createCustomer(customerForm);
          customerId = newCustomer.id;
          customerName = newCustomer.name;
          customerPhone = newCustomer.phone;
        } catch (err: any) {
          // If document already exists, fetch the existing customer instead of failing
          if (err.message === 'Documento já cadastrado' && customerForm.document) {
            const existing = await api.searchCustomers(customerForm.document);
            if (existing.length > 0) {
              customerId = existing[0].id;
              customerName = existing[0].name;
              customerPhone = existing[0].phone;
            } else {
              throw err; // Re-throw if something really weird happened
            }
          } else {
            throw err;
          }
        }
      }

      const res = await api.createOrder({
        pulseira: finalPulseira,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_id: customerId
      });

      setCurrentOrder({ id: res.id, pulseira: finalPulseira, customer_name: customerName, customer_phone: customerPhone, items: [] });
      setPulseira(finalPulseira);
      setIsModalOpen(false);
      setView('order');
      // Reset form
      setCustomerForm({ name: '', nickname: '', birthday: '', document: '', phone: '' });
      setIdentifiedCustomer(null);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao criar pedido. Verifique se a pulseira já está em uso.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSearch = async (field: string, value: string) => {
    setCustomerForm(prev => ({ ...prev, [field]: value }));

    // Search if document (CPF/RG usually 11+) or phone (11) has enough characters
    if ((field === 'document' && value.length >= 11) || (field === 'phone' && value.length >= 11)) {
      setIsSearchingCustomer(true);
      try {
        const results = await api.searchCustomers(value);
        if (results.length > 0) {
          const customer = results[0];
          setIdentifiedCustomer(customer);
          setCustomerForm({
            name: customer.name || '',
            nickname: customer.nickname || '',
            birthday: customer.birthday || '',
            document: customer.document || '',
            phone: customer.phone || ''
          });
        } else {
          setIdentifiedCustomer(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      // If the user erased the field, wipe the identified customer so it doesn't stay linked
      setIdentifiedCustomer(null);
    }
  };

  const [selectedVariableProduct, setSelectedVariableProduct] = useState<any>(null);

  const addToCart = (product: any) => {
    if (product.type === 'variable') {
      setSelectedVariableProduct(product);
      return;
    }

    const currentCartQty = cart.find(item => item.id === product.id)?.quantity || 0;

    // Check stock for composition
    if (product.type === 'composition') {
      if (currentCartQty + 1 > product.stock) {
        alert('Produto esgotado (ingredientes insuficientes)');
        return;
      }
    } else if (product.type === 'simple') {
      let available = product.stock;
      if (product.category_name === 'Garrafa') {
        // Only FULL bottles can be sold directly
        available = Math.floor(product.stock);
      }

      if (currentCartQty + 1 > available) {
        if (product.category_name === 'Garrafa' && available === 0 && product.stock > 0) {
          alert(`Você tem apenas garrafa(s) aberta(s) de ${product.name}. Venda direta bloqueada.`);
        } else {
          alert('Quantidade indisponível no estoque!');
        }
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const submitOrder = async () => {
    if (!currentOrder || isSubmittingOrder || cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const itemsToInsert = cart.map(item => ({ id: item.id, quantity: item.quantity }));
      await api.addOrderItems(currentOrder.id, itemsToInsert);

      setCart([]);
      // Refresh order and products
      const updated = await api.getOrder(pulseira);
      setCurrentOrder(updated);
      const prods = await api.getProducts();
      setProducts(prods);
      alert('Pedido enviado!');
    } catch (err) {
      alert('Erro ao enviar pedido');
      console.error(err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subtotal = ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0);
    const serviceValue = includeServiceFee ? subtotal * 0.1 : 0;
    const total = subtotal + serviceValue + coverFee;

    const html = `
        <html>
          <head>
            <title>Comanda</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0; padding: 10px; font-size: 12px; }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
              .order-header { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ddd; }
              .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .totals { border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .grand-total { font-size: 16px; font-weight: bold; margin-top: 5px; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${settings.establishment_name || 'BAR DO ZÉ'}</h2>
              ${settings.establishment_address ? `<p>${settings.establishment_address}</p>` : ''}
              ${settings.establishment_phone ? `<p>Tel: ${settings.establishment_phone}</p>` : ''}
              ${settings.establishment_cnpj ? `<p>CNPJ: ${settings.establishment_cnpj}</p>` : ''}
              <p>${new Date().toLocaleString()}</p>
            </div>
            
            ${ordersToPay.map(order => `
              <div class="order-header">
                Pulseira: ${order.pulseira}<br/>
                Cliente: ${order.customer_name || 'N/A'}
              </div>
              <div class="items">
                ${order.items.map((item: any) => `
                  <div class="item">
                    <span>${item.quantity}x ${item.product_name}</span>
                    <span>R$ ${(item.quantity * item.price_at_time).toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            `).join('')}

            <div class="totals">
              <div class="row">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
              </div>
              ${includeServiceFee ? `
              <div class="row">
                <span>Taxa Serviço (10%):</span>
                <span>R$ ${serviceValue.toFixed(2)}</span>
              </div>
              ` : ''}
              ${coverFee > 0 ? `
              <div class="row">
                <span>Couvert:</span>
                <span>R$ ${coverFee.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="row grand-total">
                <span>TOTAL:</span>
                <span>R$ ${total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>${settings.receipt_footer || 'Obrigado pela preferência!'}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePayment = async (method: string) => {
    if (ordersToPay.length === 0) return;

    try {
      // Calculate total for all orders
      const subtotal = ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0);
      const serviceValue = includeServiceFee ? subtotal * 0.1 : 0;
      const finalTotal = subtotal + serviceValue + coverFee;

      // Distribute the total payment proportionally or just pay each order's subtotal + share of fees?
      // For simplicity, we will pay each order's subtotal, and add the fees to the first order or split them.
      // However, the backend expects a payment amount for each order.
      // If we pay more than the order total, it's just recorded as a transaction.
      // Strategy: Pay each order its subtotal. Then create a separate transaction for fees? 
      // Or just distribute the fees proportionally to the order value.

      // Let's distribute the fees proportionally to each order's subtotal
      for (const order of ordersToPay) {
        const orderSubtotal = order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
        const proportion = subtotal > 0 ? orderSubtotal / subtotal : 0;
        const orderFees = (serviceValue + coverFee) * proportion;
        const orderTotalToPay = orderSubtotal + orderFees;

        await api.payOrder(order.id, orderTotalToPay, method);
      }

      alert(`Conta(s) fechada(s) com sucesso! Total: R$ ${finalTotal.toFixed(2)}`);
      setIsPaymentModalOpen(false);
      setOrdersToPay([]);
      setIncludeServiceFee(true);
      setCoverFee(0);
      setView('home');
      setPulseira('');
      setCurrentOrder(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao fechar conta. Tente novamente.');
    }
  };

  const openPaymentModal = () => {
    if (currentOrder) {
      setOrdersToPay([currentOrder]);
      setIncludeServiceFee(true);
      setCoverFee(0);
      setIsPaymentModalOpen(true);
    }
  };

  const addOrderToPayment = async () => {
    if (!extraPulseira) return;
    try {
      const order = await api.getOrder(extraPulseira);
      if (ordersToPay.find(o => o.id === order.id)) {
        alert('Pedido já adicionado');
        return;
      }
      setOrdersToPay([...ordersToPay, order]);
      setExtraPulseira('');
    } catch (err) {
      alert('Pedido não encontrado para esta pulseira');
    }
  };

  const removeOrderFromPayment = (orderId: number) => {
    setOrdersToPay(ordersToPay.filter(o => o.id !== orderId));
  };

  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== null) {
      const childIds = categories.filter(c => c.parent_id === selectedCategory).map(c => c.id);
      if (p.category_id !== selectedCategory && !childIds.includes(p.category_id)) {
        return false;
      }
    }
    return true;
  });

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center relative">
        <Link to="/" className="absolute top-6 left-6 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
          <Home size={24} />
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Painel do Garçom</h1>
            <p className="text-slate-400">Digite a pulseira para iniciar</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Buscar Pulseira Existente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pulseira}
                  onChange={(e) => setPulseira(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="0000"
                />
              </div>
            </div>
            <button
              onClick={handleEnterOrder}
              disabled={!pulseira || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <span className="animate-spin">⏳</span> : 'Acessar Pedido'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Ou</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={() => {
                setPulseira('');
                setIsModalOpen(true);
                setCustomerForm({ name: '', nickname: '', birthday: '', document: '', phone: '' });
                setIdentifiedCustomer(null);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700"
            >
              <PlusCircle size={20} />
              Vincular Cliente
            </button>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold mb-4 text-white">Vincular Cliente</h3>

              {identifiedCustomer && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 mb-4 flex items-center gap-2 text-emerald-400">
                  <Check size={20} />
                  <span className="font-bold">Cliente Identificado</span>
                </div>
              )}

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Documento (CPF/RG)</label>
                  <input
                    name="document"
                    value={customerForm.document}
                    onChange={(e) => handleCustomerSearch('document', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    placeholder="Digite apenas números"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Telefone (WhatsApp)</label>
                  <input
                    name="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => handleCustomerSearch('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  />
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                    <input
                      name="name"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Apelido</label>
                    <input
                      name="nickname"
                      value={customerForm.nickname}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, nickname: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Aniversário</label>
                    <input
                      name="birthday"
                      type="date"
                      value={customerForm.birthday}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Número da Pulseira</label>
                  <div className="flex gap-2">
                    <input
                      name="pulseira"
                      type="text"
                      required
                      placeholder="0000"
                      value={pulseira}
                      onChange={(e) => setPulseira(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="flex-1 py-2 text-slate-400 hover:text-white">Cancelar</button>
                  <button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                    {isLoading ? <span className="animate-spin">⏳</span> : (identifiedCustomer ? 'Vincular' : 'Cadastrar e Vincular')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const currentTotal = currentOrder?.items?.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0) || 0;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 transition-[padding] duration-300 ${cart.length > 0 ? 'pb-[45vh]' : 'pb-24'}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ChevronLeft />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-white">Pulseira #{pulseira}</h2>
          <p className="text-xs text-slate-400">{currentOrder?.customer_name}</p>
        </div>
        <div className="w-8" /> {/* Spacer */}
      </header>

      <main className="p-4 space-y-6">
        {/* Current Tab Summary */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Consumido</p>
              <p className="text-2xl font-bold text-emerald-400">R$ {currentTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setIsConsumptionOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors flex flex-col items-center text-xs gap-1"
            >
              <List size={20} />
              Ver Itens
            </button>
          </div>
          <button onClick={openPaymentModal} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">
            Fechar Conta
          </button>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
          >
            Todos
          </button>
          {categories.filter(c => c.show_on_waiter !== false && !c.parent_id).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.filter(p => !p.parent_id).map(product => {
            let displayStock = product.stock;

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-left hover:border-blue-500/50 active:scale-95 transition-all flex flex-col h-full"
              >
                {product.image_url && (
                  <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-slate-900">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex justify-between items-start mb-2 flex-1">
                  <span className="font-bold text-slate-200 line-clamp-2">{product.name}</span>
                  {product.type === 'variable' && <span className="text-xs bg-purple-500/20 text-purple-400 px-1 rounded shrink-0 ml-2">Opções</span>}
                </div>
                <div className="flex justify-between items-end mt-auto w-full">
                  <span className="text-emerald-400 font-medium">
                    {product.type === 'variable' ? 'A partir de...' : `R$ ${product.price.toFixed(2)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {product.type !== 'variable' && (
                      <span className={`text-xs ${displayStock <= 5 ? 'text-red-400' : 'text-slate-500'}`}>
                        {displayStock} un
                      </span>
                    )}
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-slate-500">
              Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </div>
      </main>

      {/* Variable Product Modal */}
      {selectedVariableProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedVariableProduct.name}</h3>
              <button onClick={() => setSelectedVariableProduct(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <p className="text-slate-400 mb-4 text-sm">Selecione uma opção:</p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {products.filter(p => p.parent_id === selectedVariableProduct.id).map(variation => {
                let displayStock = variation.stock;

                return (
                  <button
                    key={variation.id}
                    onClick={() => {
                      addToCart(variation);
                      setSelectedVariableProduct(null);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    {variation.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                        <img src={variation.image_url} alt={variation.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <p className="font-bold text-slate-200">{variation.name}</p>
                      <p className="text-emerald-400 text-sm">R$ {variation.price.toFixed(2)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${displayStock <= 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {displayStock > 0 ? `${displayStock} un` : 'Esgotado'}
                    </span>
                  </button>
                )
              })}
              {products.filter(p => p.parent_id === selectedVariableProduct.id).length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhuma variação disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-4 pb-6 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[35vh] flex flex-col">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-400" />
              Carrinho ({cart.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
            <span className="font-bold text-emerald-400 text-lg">R$ {total.toFixed(2)}</span>
          </div>

          <div className="space-y-3 overflow-y-auto mb-3 flex-1 min-h-0 pr-1">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-300 line-clamp-1 flex-1 mr-2">{item.name}</span>
                <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 shrink-0">
                  <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">-</button>
                  <span className="font-mono w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">+</button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitOrder}
            disabled={isSubmittingOrder || cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-70 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all shrink-0 flex justify-center items-center gap-2"
          >
            {isSubmittingOrder ? <span className="animate-spin">⏳</span> : 'Confirmar Pedido'}
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="text-xl font-bold text-white">Fechar Conta</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                {ordersToPay.map(order => {
                  const orderTotal = order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
                  return (
                    <div key={order.id} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">#{order.pulseira} - {order.customer_name}</p>
                        <p className="text-xs text-slate-400">{order.items.length} itens</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">R$ {orderTotal.toFixed(2)}</p>
                        {ordersToPay.length > 1 && (
                          <button onClick={() => removeOrderFromPayment(order.id)} className="text-red-400 text-xs hover:text-red-300 mt-1">Remover</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adicionar outra pulseira</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraPulseira}
                    onChange={(e) => setExtraPulseira(e.target.value)}
                    placeholder="0000"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button onClick={addOrderToPayment} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-200 font-medium">
                    R$ {ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0).toFixed(2)}
                  </span>
                </div>

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
                    R$ {(includeServiceFee ? ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0) * 0.1 : 0).toFixed(2)}
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
                    R$ {(
                      ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0) +
                      (includeServiceFee ? ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0) * 0.1 : 0) +
                      coverFee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handlePrint} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-slate-600">
                  🖨️ Imprimir Comanda
                </button>
                <button onClick={() => handlePayment('cash')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  💵 Dinheiro
                </button>
                <button onClick={() => handlePayment('card')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  💳 Cartão
                </button>
                <button onClick={() => handlePayment('pix')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  💠 PIX
                </button>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consumption Modal */}
      {isConsumptionOpen && currentOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Consumo Atual</h3>
              <button onClick={() => setIsConsumptionOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {currentOrder.items.map((item: any) => (
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
              {currentOrder.items.length === 0 && (
                <p className="text-center text-slate-500 py-8">Nenhum item consumido ainda.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="text-xl font-bold text-emerald-400">
                  R$ {currentTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

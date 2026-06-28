import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

import {
  Search, Plus, Minus, ShoppingCart, User, CreditCard,
  ChevronLeft, Check, X, Home, Filter, List, PlusCircle, Trash2, RefreshCw, ClipboardList
} from 'lucide-react';

export default function Waiter() {
  const [view, setViewInternal] = useState<'home' | 'order'>('home');
  const setView = (v: 'home' | 'order') => {
    setViewInternal(v);
    if (v === 'home') {
      // Auto-refresh open orders when returning to home
      loadOpenOrders();
    }
  };
  const [pulseira, setPulseira] = useState('');

  // Helper: limita a 4 dígitos numéricos e auto-pad com zeros
  const handlePulseiraChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPulseira(digits);
  };
  const padPulseira = (value: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '').slice(0, 4).padStart(4, '0');
  };
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariableProduct, setSelectedVariableProduct] = useState<any>(null);
  const [wizardProduct, setWizardProduct] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardSelections, setWizardSelections] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConsumptionOpen, setIsConsumptionOpen] = useState(false);
  const [itemToSwap, setItemToSwap] = useState<any>(null);
  const [swapSearchTerm, setSwapSearchTerm] = useState('');

  // Merge order state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergePulseira, setMergePulseira] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Transfer order state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');
  const [transferResults, setTransferResults] = useState<any[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  // Stock Correction State
  const [showStockCorrectionModal, setShowStockCorrectionModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<any>(null);
  const [newStockQuantity, setNewStockQuantity] = useState('');
  const [originalCartProduct, setOriginalCartProduct] = useState<any>(null);


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
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Edit Pulseira inline state
  const [isEditingPulseira, setIsEditingPulseira] = useState(false);
  const [editPulseiraValue, setEditPulseiraValue] = useState('');

  // Fix Pulseira State
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const [fixSearchTerm, setFixSearchTerm] = useState('');
  const [fixResults, setFixResults] = useState<{ employees: any[], customers: any[] }>({ employees: [], customers: [] });

  // Unified Payment State
  const [ordersToPay, setOrdersToPay] = useState<any[]>([]);
  const [extraPulseira, setExtraPulseira] = useState('');
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [coverFee, setCoverFee] = useState(0);
  const [settings, setSettings] = useState<any>({});
  const [splitEntries, setSplitEntries] = useState<Array<{ id: string; method: string; amount: number }>>([]);
  const [isProcessingSplit, setIsProcessingSplit] = useState(false);
  const [splitInputAmount, setSplitInputAmount] = useState('');

  // Open Orders Panel State
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const loadOpenOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const orders = await api.getOpenOrdersSummary();
      setOpenOrders(orders);
    } catch (err) {
      console.error('Erro ao carregar comandas abertas:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts);
    api.getCategories().then(setCategories);
    api.getSettings().then(setSettings);
    loadOpenOrders();
  }, []);

  useEffect(() => {
    if (view !== 'home') return;
    const interval = setInterval(() => {
      loadOpenOrders();
    }, 12000); // 12 segundos
    return () => clearInterval(interval);
  }, [view]);



  const handleNameSearch = async (value: string) => {
    setCustomerForm(prev => ({ ...prev, name: value }));
    setIdentifiedCustomer(null);
    if (value.length < 2) { setNameSuggestions([]); setShowNameSuggestions(false); return; }
    try {
      const results = await api.searchCustomers(value);
      setNameSuggestions(results);
      setShowNameSuggestions(results.length > 0);
    } catch { setNameSuggestions([]); }
  };

  const selectCustomerSuggestion = async (customer: any) => {
    setIdentifiedCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      nickname: customer.nickname || '',
      birthday: customer.birthday || '',
      document: customer.document || '',
      phone: customer.phone || '',
    });
    setShowNameSuggestions(false);
    setNameSuggestions([]);
    if (customer.fixed_pulseira) {
      setPulseira(customer.fixed_pulseira);
    } else {
      try {
        const next = await api.getNextPulseira();
        setPulseira(next);
      } catch { /* keep current pulseira */ }
    }
  };

  const handleEnterOrder = async (overridePulseira?: string) => {
    const rawPulseira = overridePulseira || pulseira;
    if (!rawPulseira) return;
    const paddedPulseira = padPulseira(rawPulseira);
    setPulseira(paddedPulseira);

    const pNum = parseInt(paddedPulseira);
    const isRestricted = pNum >= 9975 && pNum <= 9999;

    setIsLoading(true);
    try {
      let owner = null;
      if (isRestricted) {
        owner = await api.findFixedOwner(paddedPulseira);
        if (!owner) {
          alert('Esta faixa de comandas (9975-9999) é exclusiva para funcionários cadastrados.');
          setIsLoading(false);
          return;
        }
      }

      try {
        const order = await api.getOrder(paddedPulseira);
        setCurrentOrder(order);
        setView('order');
      } catch (err) {
        // Comanda 0000 = cliente rotativo, cria automaticamente sem modal
        if (paddedPulseira === '0000') {
          await api.createOrder({ pulseira: '0000', customer_name: 'Rotativo' });
          const order = await api.getOrder('0000');
          setCurrentOrder(order);
          setView('order');
          return;
        }

        // Para pulseiras fora da faixa restrita, também verifica dono fixo
        if (!owner) {
          owner = await api.findFixedOwner(paddedPulseira);
        }

        // Se tem dono fixo (funcionário ou cliente), cria automaticamente sem modal
        if (owner) {
          await api.createOrder({ pulseira: paddedPulseira, customer_name: owner.name });
          const order = await api.getOrder(paddedPulseira);
          setCurrentOrder(order);
          setView('order');
          return;
        }

        // Pulseira livre — abre modal para vincular cliente
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar comanda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePulseira = async (novo) => {
    if (!currentOrder) return;
    const padded = novo.replace(/\D/g, "").padStart(4, "0");
    if (!padded || padded === "0000") {
      alert("Digite um n�mero v�lido.");
      return;
    }
    if (padded === pulseira) return;
    setIsLoading(true);
    try {
      await api.updateOrderPulseira(currentOrder.id, padded);
      setPulseira(padded);
      const updated = await api.getOrder(padded);
      setCurrentOrder(updated);
      alert("N�mero da comanda corrigido com sucesso para #" + padded + "!");
    } catch (err) {
      alert(err.message || "Erro ao corrigir n�mero da comanda.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapItem = async (newProduct: any) => {
    if (!itemToSwap || !currentOrder) return;
    setIsLoading(true);
    try {
      if (newProduct.type === 'variable') {
         alert('Para trocar, por favor selecione a variante final (sub-produto).');
         setIsLoading(false);
         return;
      }
      await api.swapOrderItem(currentOrder.id, itemToSwap.id, newProduct.id);
      
      setItemToSwap(null);
      setSwapSearchTerm('');
      
      const updated = await api.getOrder(pulseira);
      setCurrentOrder(updated);
      alert('Produto trocado com sucesso!');
    } catch(err) {
      alert('Erro ao trocar produto.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formPulseira = formData.get('pulseira') as string;

    const finalPulseira = padPulseira(formPulseira || pulseira);

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

      // Fetch refined order with discount info
      const order = await api.getOrder(finalPulseira);
      setCurrentOrder(order);
      setPulseira(finalPulseira);
      setIsModalOpen(false);
      setView('order');
      // Reset form
      setCustomerForm({ name: '', nickname: '', birthday: '', document: '', phone: '' });
      setIdentifiedCustomer(null);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchFix = async (term: string) => {
    setFixSearchTerm(term);
    if (term.length < 2) {
      setFixResults({ employees: [], customers: [] });
      return;
    }
    try {
      const emps = await api.getEmployees();
      const custs = await api.searchCustomers(term);
      const filteredEmps = emps.filter((e: any) => e.name.toLowerCase().includes(term.toLowerCase()));
      setFixResults({ employees: filteredEmps, customers: custs });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFixPulseira = async (type: 'employee' | 'customer', id: any) => {
    if (!currentOrder) return;
    setIsLoading(true);
    try {
      await api.fixPulseira(currentOrder.pulseira, type, id);
      alert('Comanda fixada com sucesso!');
      setIsFixModalOpen(false);
      setFixSearchTerm('');
      const updated = await api.getOrder(currentOrder.pulseira);
      setCurrentOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao fixar comanda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfixCurrent = async () => {
    if (!currentOrder || !confirm('Deseja remover o vínculo fixo desta comanda?')) return;
    setIsLoading(true);
    try {
      const owner = await api.findFixedOwner(currentOrder.pulseira);
      if (owner) {
        await api.unfixPulseira(owner.type as 'employee' | 'customer', owner.id);
        alert('Vínculo removido.');
        const updated = await api.getOrder(currentOrder.pulseira);
        setCurrentOrder(updated);
      }
    } catch (err: any) {
      alert('Erro ao desfixar');
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

  const addToCart = (product: any) => {
    // If it has modifiers, open wizard
    if (product.modifier_groups && product.modifier_groups.length > 0 && !product.__is_calculated) {
      setWizardProduct(product);
      setWizardStep(0);
      setWizardSelections([]);
      return;
    }

    if (product.type === 'variable') {
      setSelectedVariableProduct(product);
      return;
    }

    const existing = cart.find(item => item.id === product.id && !item.modifiers);
    const intentQty = (existing?.quantity || 0) + 1;

    // Check stock for composition
    if (product.type === 'composition') {
      if (intentQty > product.stock) {
        // Find which ingredients are out of stock
        const insufficientIngredients = (product.ingredients || []).filter((ing: any) => {
          let neededQty = ing.quantity || 0;
          if (ing.ingredient_category === 'Garrafa' && ing.ingredient_bottle_volume_ml) {
            neededQty = neededQty / ing.ingredient_bottle_volume_ml;
          }
          const available = ing.ingredient_stock || 0;
          return (intentQty * neededQty) > available;
        });

        if (insufficientIngredients.length > 0) {
          const targetIng = insufficientIngredients[0];
          const ingProduct = products.find((p: any) => p.id === targetIng.ingredient_id);
          if (ingProduct) {
            setOriginalCartProduct(product);
            setSelectedStockProduct(ingProduct);
            setNewStockQuantity('');
            setShowStockCorrectionModal(true);
            return;
          }
        }

        alert('Produto esgotado (ingredientes insuficientes)');
        return;
      }
    } else if (product.type === 'simple') {
      let available = product.stock;
      if (product.category_name === 'Garrafa') {
        // Only FULL bottles can be sold directly
        available = Math.floor(product.stock);
      }

      if (intentQty > available) {
        setOriginalCartProduct(null);
        setSelectedStockProduct(product);
        setNewStockQuantity('');
        setShowStockCorrectionModal(true);
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

  const handleConfirmStockCorrection = async () => {
    if (!selectedStockProduct) return;
    const qty = parseFloat(newStockQuantity);
    if (isNaN(qty) || qty < 0) {
      alert('Por favor, insira uma quantidade válida.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.quickUpdateStock(selectedStockProduct.id, qty);
      
      // Reload products list
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
      
      // Close modal
      setShowStockCorrectionModal(false);
      setNewStockQuantity('');
      
      // If there was an original composition product being added
      if (originalCartProduct) {
        const refreshedOriginal = updatedProducts.find((p: any) => p.id === originalCartProduct.id);
        setOriginalCartProduct(null);
        setSelectedStockProduct(null);
        if (refreshedOriginal) {
          addToCart(refreshedOriginal);
        }
      } else {
        const refreshedProduct = updatedProducts.find((p: any) => p.id === selectedStockProduct.id);
        setSelectedStockProduct(null);
        if (refreshedProduct) {
          addToCart(refreshedProduct);
        }
      }
    } catch (err: any) {
      alert('Erro ao atualizar estoque: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
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

  const finalizeWizard = () => {
    if (!wizardProduct) return;

    // 1. Calculate the Ratio for inclusive items
    // Sum of original prices of all chosen items
    const totalOriginalPrice = wizardSelections.reduce((acc, sel) => acc + (sel.original_price || 0), 0);
    const ratio = totalOriginalPrice > 0 ? (wizardProduct.price / totalOriginalPrice) : 1;

    // 2. Adjust prices
    let finalComboPrice = 0;
    const finalModifiers = wizardSelections.map(sel => {
      // Find the name for history transparency
      const p = products.find(prod => prod.id === sel.product_id);
      const adjustedPrice = sel.is_fixed_price ? sel.original_price : (sel.original_price * ratio);
      finalComboPrice += adjustedPrice;
      return {
        modifier_item_id: sel.modifier_item_id,
        product_id: sel.product_id,
        product_name: p?.name || 'Item',
        price_at_time: adjustedPrice,
        cost_at_time: sel.cost_at_time || 0
      };
    });

    // 3. Add to cart as a "calculated" item
    const comboInstance = {
      ...wizardProduct,
      id: `${wizardProduct.id}_${Date.now()}`, // Unique ID for cart management
      base_product_id: wizardProduct.id,
      __is_calculated: true,
      price: finalComboPrice,
      price_at_time: finalComboPrice,
      quantity: 1,
      modifiers: finalModifiers
    };

    setCart([...cart, comboInstance]);
    setWizardProduct(null);
  };

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showCartConfirmModal, setShowCartConfirmModal] = useState(false);

  const submitOrder = async () => {
    if (!currentOrder || isSubmittingOrder || cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const itemsToInsert = cart.map(item => {
        // Para combos/wizard, o custo é a soma dos custos dos modificadores
        // Para simples/composição, usa o cost_price do produto (já calculado dinamicamente pelo getProducts)
        const costAtTime = (item.modifiers && item.modifiers.length > 0)
          ? item.modifiers.reduce((sum: number, m: any) => sum + (m.cost_at_time || 0), 0)
          : (item.cost_price || 0);

        return {
          id: item.base_product_id || item.id,
          quantity: item.quantity,
          price_at_time: item.price_at_time || item.price,
          cost_at_time: costAtTime,
          modifiers: item.modifiers
        };
      });
      await api.addOrderItems(currentOrder.id, itemsToInsert);

      setCart([]);
      setCurrentOrder(null);
      setPulseira('');
      setView('home');

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
    const subtotal = ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0);
    const serviceValue = includeServiceFee ? subtotal * 0.1 : 0;
    const total = subtotal + serviceValue + coverFee;

    const html = `
        <html>
          <head>
            <title>Comanda</title>
            <style>
              @page { margin: 2mm; size: 80mm auto; }
              * { box-sizing: border-box; }
              body {
                font-family: Arial, Helvetica, sans-serif;
                width: 76mm;
                margin: 0;
                padding: 2mm;
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
                background: #fff;
              }
              h2 { font-size: 16pt; font-weight: 900; text-align: center; margin: 0 0 2mm; }
              p { margin: 1mm 0; text-align: center; font-size: 11pt; }
              hr { border: none; border-top: 1.5px solid #000; margin: 3mm 0; }
              .dashed { border-top: 1.5px dashed #000; }
              table { width: 100%; border-collapse: collapse; }
              td { font-size: 12pt; padding: 1mm 0; vertical-align: top; }
              td.qty { width: 8mm; font-weight: 900; }
              td.name { font-weight: 700; padding-right: 2mm; }
              td.price { width: 20mm; text-align: right; font-weight: 900; white-space: nowrap; }
              .section-title { font-size: 11pt; font-weight: 900; background: #000; color: #fff; padding: 1mm 2mm; margin: 3mm 0 1mm; }
              .total-row td { font-size: 12pt; font-weight: 700; padding: 1mm 0; }
              .grand td { font-size: 16pt; font-weight: 900; padding-top: 2mm; }
              .footer { text-align: center; margin-top: 4mm; font-size: 11pt; font-weight: 700; }
            </style>
          </head>
          <body>
            <h2>${settings.establishment_name || 'BAR DO ZE'}</h2>
            ${settings.establishment_address ? `<p>${settings.establishment_address}</p>` : ''}
            ${settings.establishment_phone ? `<p>Tel: ${settings.establishment_phone}</p>` : ''}
            ${settings.establishment_cnpj ? `<p>CNPJ: ${settings.establishment_cnpj}</p>` : ''}
            <p>${new Date().toLocaleString('pt-BR')}</p>
            <p style="text-transform: uppercase; font-size: 10pt;">ATENDENTE: ${localStorage.getItem('pos_employee_name') || 'Desconhecido'}</p>
            <hr class="dashed">

            ${ordersToPay.map((order: any) => `
              <div class="section-title">Pulseira ${order.pulseira} &mdash; ${order.customer_name || 'Cliente'}</div>
              <table>
                ${order.items.map((item: any) => `
                  <tr>
                    <td class="qty">${item.quantity}x</td>
                    <td class="name">${item.product_name}</td>
                    <td class="price">R$&nbsp;${(item.quantity * item.price_at_time).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            `).join('')}

            <hr class="dashed">
            <table class="total-row">
              <tr>
                <td>Subtotal</td>
                <td class="price">R$&nbsp;${subtotal.toFixed(2)}</td>
              </tr>
              ${includeServiceFee ? `
              <tr>
                <td>Taxa Servico (10%)</td>
                <td class="price">R$&nbsp;${serviceValue.toFixed(2)}</td>
              </tr>` : ''}
              ${coverFee > 0 ? `
              <tr>
                <td>Couvert</td>
                <td class="price">R$&nbsp;${coverFee.toFixed(2)}</td>
              </tr>` : ''}
            </table>
            <hr>
            <table class="grand">
              <tr>
                <td><b>TOTAL</b></td>
                <td class="price"><b>R$&nbsp;${total.toFixed(2)}</b></td>
              </tr>
            </table>
            <hr class="dashed">

            <div class="footer">${settings.receipt_footer || 'Obrigado pela preferencia!'}</div>
          </body>
        </html>
      `;

    // Usa iframe oculto — sem pop-up bloqueado
    let frame = document.getElementById('waiter-print-frame') as HTMLIFrameElement | null;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'waiter-print-frame';
      frame.style.cssText = 'display:none;position:fixed;width:0;height:0;border:0;';
      document.body.appendChild(frame);
    }
    const fdoc = frame.contentWindow!.document;
    fdoc.open();
    fdoc.write(html);
    fdoc.close();
    frame.onload = () => {
      try {
        frame!.contentWindow!.focus();
        frame!.contentWindow!.print();
      } catch (e) {
        console.warn('Erro ao imprimir:', e);
      }
      frame!.onload = null;
    };
  };

  const handleSplitPayment = async () => {
    if (ordersToPay.length === 0 || splitEntries.length === 0 || isProcessingSplit) return;
    setIsProcessingSplit(true);
    try {
      const subtotal = ordersToPay.reduce((acc, order) => acc + order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0), 0);
      const totalDiscount = ordersToPay.reduce((acc, order) => {
        const sub = order.items.reduce((sum: number, item: any) => sum + (item.price_at_time * item.quantity), 0);
        return acc + (Math.min(sub, order.discount_cap || 0) * ((order.discount_percentage || 0) / 100));
      }, 0);
      const serviceValue = includeServiceFee ? (subtotal - totalDiscount) * 0.1 : 0;
      const finalTotal = subtotal - totalDiscount + serviceValue + coverFee;

      for (const order of ordersToPay) {
        const orderSubtotal = order.items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
        const proportion = subtotal > 0 ? orderSubtotal / subtotal : 1 / ordersToPay.length;
        const orderTotal = (orderSubtotal - (Math.min(orderSubtotal, order.discount_cap || 0) * ((order.discount_percentage || 0) / 100))) * (1 + (includeServiceFee ? 0.1 : 0)) + coverFee * proportion;

        const orderEntries = splitEntries.map(e => ({
          method: e.method,
          amount: parseFloat((e.amount * proportion).toFixed(2))
        }));
        // Adjust last entry to correct rounding so sum equals orderTotal
        const entrySum = orderEntries.reduce((s, e) => s + e.amount, 0);
        if (orderEntries.length > 0) {
          orderEntries[orderEntries.length - 1].amount = Math.max(0, parseFloat((orderEntries[orderEntries.length - 1].amount + (orderTotal - entrySum)).toFixed(2)));
        }

        await api.paySplitOrder(order.id, orderEntries);
      }

      // Imprimir automaticamente ao confirmar
      handlePrint();

      setIsPaymentModalOpen(false);
      setSplitEntries([]);
      setSplitInputAmount('');
      setOrdersToPay([]);
      setIncludeServiceFee(true);
      setCoverFee(0);
      setView('home');
      setPulseira('');
      setCurrentOrder(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao fechar conta. Tente novamente.');
    } finally {
      setIsProcessingSplit(false);
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

  // Encerra comanda sem cobrança (apenas quando total = R$ 0,00)
  const handleCloseZeroOrder = async () => {
    if (!currentOrder) return;
    if (!window.confirm(`Encerrar a comanda #${pulseira} sem cobrança? Ela não possui consumo.`)) return;
    setIsLoading(true);
    try {
      await api.closeZeroOrder(currentOrder.id);
      setView('home');
      setPulseira('');
      setCurrentOrder(null);
      loadOpenOrders();
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar comanda.');
    } finally {
      setIsLoading(false);
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
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Bypasses hierarchy for quick search
      const matchName = p.name?.toLowerCase().includes(term);
      const isVariantMatching = p.parent_id && p.name?.toLowerCase().includes(term);
      const isParentMatching = !p.parent_id && p.name?.toLowerCase().includes(term);
      return matchName || isParentMatching || isVariantMatching;
    }
    
    // Hide variations from main list
    if (p.parent_id) return false;

    // Filter by Hierarchy
    if (selectedCategory !== null) {
      const sons = categories.filter(c => c.parent_id === selectedCategory);
      const hasSons = sons.length > 0;

      if (hasSons) {
        // If has sons, must select one
        if (selectedSubCategory === null) return false;
        // Show only if belongs to selected subcategory
        return p.category_id === selectedSubCategory;
      } else {
        // If Father has NO sons, show products directly under it
        return p.category_id === selectedCategory;
      }
    }

    return true; // Show all if no category selected
  });

  const swapFilteredProducts = products.filter(p => {
    if (swapSearchTerm) {
      const term = swapSearchTerm.toLowerCase();
      // Durante a troca, só mostramos os finais (simples/composition ou os próprios "sub-produtos" variaveis)
      if (p.type === 'variable') return false; 
      return p.name?.toLowerCase().includes(term);
    }
    // Mostra tudo se nao tiver pesquisa? Muito confuso. Devolve so os 20 primeiros
    return !p.parent_id;
  }).slice(0, 30);

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Início">
              <Home size={18} />
            </Link>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Painel do Garçom</h1>
            <div className="w-8" />
          </div>

          {/* Single-line: Input + Acessar + Vincular */}
          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pulseira}
                onChange={(e) => handlePulseiraChange(e.target.value)}
                onBlur={() => { if (pulseira) setPulseira(padPulseira(pulseira)); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEnterOrder(); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-center text-xl font-mono tracking-[0.3em] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white placeholder-slate-600"
                placeholder="0000"
              />
            </div>
            <button
              onClick={() => handleEnterOrder()}
              disabled={!pulseira || isLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 rounded-xl font-bold text-sm transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
            >
              {isLoading ? <span className="animate-spin text-sm">⏳</span> : (
                <>
                  <ChevronLeft size={14} className="rotate-180" />
                  Acessar
                </>
              )}
            </button>
            <button
              onClick={() => {
                setPulseira('');
                setIsModalOpen(true);
                setCustomerForm({ name: '', nickname: '', birthday: '', document: '', phone: '' });
                setIdentifiedCustomer(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center"
              title="Vincular Cliente"
            >
              <PlusCircle size={20} />
            </button>
          </div>
        </header>

        {/* Open Orders Panel — Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Comandas Abertas</h2>
              {openOrders.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {openOrders.length}
                </span>
              )}
            </div>
            <button
              onClick={loadOpenOrders}
              disabled={isLoadingOrders}
              className="p-1.5 text-slate-500 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={16} className={isLoadingOrders ? 'animate-spin' : ''} />
            </button>
          </div>

          {isLoadingOrders && openOrders.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <RefreshCw size={28} className="mx-auto mb-3 text-slate-600 animate-spin" />
              <p className="text-slate-500 text-sm">Carregando comandas...</p>
            </div>
          ) : openOrders.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <ClipboardList size={40} className="mx-auto mb-3 text-slate-800" />
              <p className="text-slate-600 text-sm font-medium">Nenhuma comanda aberta</p>
              <p className="text-slate-700 text-xs mt-1">Abra uma comanda digitando o número acima</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {openOrders.map(order => {
                const totalWithFee = order.total * 1.1;
                const getBg = (total: number) => {
                  if (total >= 200) return 'bg-amber-500/5 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10';
                  if (total >= 100) return 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-500/10';
                  if (total > 0) return 'bg-blue-500/5 border-blue-500/20 hover:border-blue-400 hover:bg-blue-500/10';
                  return 'bg-slate-900/60 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/60';
                };
                const getValueColor = (total: number) => {
                  if (total >= 200) return 'text-amber-400';
                  if (total >= 100) return 'text-emerald-400';
                  if (total > 0) return 'text-blue-400';
                  return 'text-slate-500';
                };

                return (
                  <button
                    key={order.id}
                    onClick={() => handleEnterOrder(order.pulseira)}
                    className={`border rounded-xl p-3 text-center transition-all active:scale-95 flex flex-col items-center gap-1 group ${getBg(totalWithFee)}`}
                  >
                    <span className="text-2xl font-black font-mono text-white tracking-tight leading-none group-hover:text-blue-300 transition-colors">
                      {order.pulseira}
                    </span>
                    <span className="text-2xl font-black text-slate-400 leading-tight line-clamp-1 w-full">
                      {order.customer_name || '—'}
                    </span>
                    <span className={`text-2xl font-black ${getValueColor(totalWithFee)} leading-none`}>
                      R$ {totalWithFee.toFixed(0)}
                    </span>
                    {order.items_count > 0 && (
                      <span className="text-xs text-slate-600 leading-none">
                        {order.items_count} {order.items_count === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </main>

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
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                    <input
                      name="name"
                      required
                      autoComplete="off"
                      value={customerForm.name}
                      onChange={e => handleNameSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 180)}
                      onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                      placeholder="Digite o nome completo..."
                    />
                    {showNameSuggestions && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                        {nameSuggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selectCustomerSuggestion(c)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center justify-between gap-2 border-b border-slate-700/50 last:border-0"
                          >
                            <div>
                              <p className="font-medium text-slate-200 text-sm">{c.name}</p>
                              {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                            </div>
                            {c.fixed_pulseira
                              ? <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded shrink-0">⚓ {c.fixed_pulseira}</span>
                              : <span className="text-xs text-slate-500 shrink-0">→ próx. nº</span>
                            }
                          </button>
                        ))}
                      </div>
                    )}
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

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Data de Nascimento (Aniversário)</label>
                    <input
                      name="birthday"
                      type="date"
                      value={customerForm.birthday}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    />
                  </div>

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
                    <label className="block text-sm font-medium text-slate-400 mb-1">Apelido <span className="text-xs opacity-70">"como vai ser chamado na Pulseira"</span></label>
                    <input
                      name="nickname"
                      value={customerForm.nickname}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, nickname: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Número da Pulseira</label>
                    <div className="flex gap-2">
                      <input
                        name="pulseira"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="0000"
                        value={pulseira}
                        onChange={(e) => handlePulseiraChange(e.target.value)}
                        onBlur={() => { if (pulseira) setPulseira(padPulseira(pulseira)); }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono tracking-widest text-center text-xl"
                      />
                    </div>
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
  
  // Refined total calculations including historical logic and new discounts
  const subtotalConsumido = currentOrder?.items?.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0) || 0;
  
  // Discount Calculation logic
  const discount_percentage = currentOrder?.discount_percentage || 0;
  const discount_cap = currentOrder?.discount_cap || 0;
  
  // Applied Discount: min(subtotal, cap) * (percentage / 100)
  const applied_discount = Math.min(subtotalConsumido, discount_cap) * (discount_percentage / 100);
  const currentTotal = subtotalConsumido - applied_discount;

  const getCategoryColor = (name: string, isSelected: boolean) => {
    if (!name) return isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400';
    const n = name.toUpperCase();
    // Mapear por nome limpo (sem emojis - já foram retirados do banco)
    if (n.startsWith('COMIDA')) return isSelected ? 'bg-yellow-500 text-yellow-950 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20';
    if (n.startsWith('BEBIDAS (ALC') || n === 'BEBIDAS (ALCOOL)') return isSelected ? 'bg-emerald-500 text-emerald-950 font-bold shadow-[0_0_15px_rgba(10,185,129,0.3)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20';
    if (n.startsWith('BEBIDAS (SEM') || n === 'BEBIDAS (SEM ALCOOL)') return isSelected ? 'bg-sky-500 text-sky-950 font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20';
    if (n.startsWith('CAIPIRIN')) return isSelected ? 'bg-lime-500 text-lime-950 font-bold shadow-[0_0_15px_rgba(132,204,22,0.3)]' : 'bg-lime-500/10 text-lime-400 border border-lime-500/30 hover:bg-lime-500/20';
    if (n.startsWith('DRINK') || n.startsWith('DOSE')) return isSelected ? 'bg-orange-500 text-orange-950 font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20';
    if (n.startsWith('COMBO')) return isSelected ? 'bg-purple-500 text-purple-950 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20';
    if (n.startsWith('GARRAFA')) return isSelected ? 'bg-red-500 text-red-950 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20';
    if (n.startsWith('LAZER') || n.startsWith('NARGU')) return isSelected ? 'bg-slate-300 text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700';
    return isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50';
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 transition-[padding] duration-300 ${cart.length > 0 ? 'pb-[45vh]' : 'pb-24'}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95 transition-all font-medium text-sm"
        >
          <ChevronLeft size={18} />
          Painel
        </button>
        <div className="text-center flex flex-col items-center">
          {isEditingPulseira ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={editPulseiraValue}
                autoFocus
                onChange={(e) => setEditPulseiraValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-24 bg-slate-800 border-2 border-amber-500 rounded-lg px-2 py-1 text-white font-mono text-center text-lg tracking-widest outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const novo = editPulseiraValue.padStart(4, '0');
                    if (!novo || novo === '0000') return;
                    setIsEditingPulseira(false);
                    handleEnterOrder(novo);
                  }
                  if (e.key === 'Escape') setIsEditingPulseira(false);
                }}
              />
              <button
                onClick={() => {
                  const novo = editPulseiraValue.padStart(4, '0');
                  if (!novo || novo === '0000') { setIsEditingPulseira(false); return; }
                  setIsEditingPulseira(false);
                  handleEnterOrder(novo);
                }}
                className="p-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-white"
                title="Confirmar"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => setIsEditingPulseira(false)}
                className="p-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                title="Cancelar"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-white">Pulseira #{pulseira}</h2>
              <button
                onClick={() => { setEditPulseiraValue(pulseira); setIsEditingPulseira(true); }}
                className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-full transition-all border border-amber-500/30"
                title="Trocar número da pulseira"
              >
                TROCAR
              </button>
              {currentOrder?.is_fixed && (
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-blue-500/20">
                  📌 FIXA
                </span>
              )}
            </div>
          )}
          <p className="text-lg font-bold text-emerald-400 mt-0.5 leading-none">{currentOrder?.customer_name || 'Cliente'}</p>
        </div>
        <button 
          onClick={() => setIsFixModalOpen(true)}
          className={`p-2 rounded-xl transition-all ${currentOrder?.is_fixed ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
          title={currentOrder?.is_fixed ? 'Gerenciar Vínculo' : 'Fixar Comanda'}
        >
          <User size={24} />
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* Current Tab Summary */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Resumo de Consumo</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-black text-white">R$ {currentTotal.toFixed(2)}</p>
                 {applied_discount > 0 && (
                   <span className="text-xs text-slate-500 line-through">R$ {subtotalConsumido.toFixed(2)}</span>
                 )}
              </div>
              {applied_discount > 0 && (
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Desconto Aplicado: - R$ {applied_discount.toFixed(2)}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsConsumptionOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors flex flex-col items-center text-xs gap-1"
            >
              <List size={20} />
              Ver Itens
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={openPaymentModal} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600">
              Fechar Conta
            </button>
            <button
              onClick={() => { setMergePulseira(''); setIsMergeModalOpen(true); }}
              className="px-4 py-3 bg-slate-800 hover:bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-amber-500/50"
              title="Importar outra comanda"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={() => { setTransferSearch(''); setTransferResults([]); setIsTransferModalOpen(true); }}
            className="w-full py-2.5 bg-slate-800/60 hover:bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-violet-500/40 flex items-center justify-center gap-2"
          >
            <ChevronLeft size={14} className="rotate-180" />
            Enviar para Comanda Fixa
          </button>
        </div>

        {/* Main Categories (Fathers) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubCategory(null);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === null
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
          >
            Todos
          </button>
          {categories
            .filter(c => c.show_on_waiter !== false && !c.parent_id)
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory(null);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${getCategoryColor(cat.name, selectedCategory === cat.id)}`}
              >
                {cat.name}
              </button>
            ))}
        </div>

        {/* Subcategories (Sons) - Only if Father has children */}
        {selectedCategory && categories.filter(c => c.parent_id === selectedCategory).length > 0 && (
          <div className="flex flex-col gap-2 -mt-2 animate-in slide-in-from-top-1 duration-200">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Subcategorias:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories
                .filter(c => c.parent_id === selectedCategory)
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedSubCategory === sub.id
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                  >
                    {sub.name}
                  </button>
                ))}
            </div>
          </div>
        )}

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
          {filteredProducts.length === 0 && !searchTerm && selectedCategory && categories.filter(c => c.parent_id === selectedCategory).length > 0 && selectedSubCategory === null ? (
             <div className="col-span-2 text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl animate-pulse">
               <Filter className="mx-auto mb-3 text-slate-600" size={32} />
               <p className="text-slate-400 font-medium italic">Selecione uma subcategoria...</p>
             </div>
          ) : filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-slate-500">
              {searchTerm ? 'Nenhum produto encontrado na busca.' : 'Nenhum produto encontrado nesta categoria.'}
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

      {/* Wizard (Combo Modifiers) Modal */}
      {wizardProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-extrabold text-white">{wizardProduct.name}</h3>
                <button onClick={() => setWizardProduct(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Passo {wizardStep + 1} de {wizardProduct.modifier_groups.length}
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${((wizardStep + 1) / wizardProduct.modifier_groups.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Step Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-slate-200 uppercase tracking-tight">
                  {wizardProduct.modifier_groups[wizardStep].name}
                </h4>
                <p className="text-xs text-slate-500 italic">Selecione uma opção para continuar:</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {wizardProduct.modifier_groups[wizardStep].product_modifier_items.map((mItem: any) => {
                  const p = products.find(prod => prod.id === mItem.linked_product_id);
                  const hasStock = p && p.stock > 0;
                  
                  return (
                    <button
                      key={mItem.id}
                      disabled={!hasStock}
                      onClick={() => {
                        const newSelections = [...wizardSelections, {
                          modifier_item_id: mItem.id,
                          product_id: p.id,
                          is_fixed_price: mItem.is_fixed_price,
                          original_price: p.price,
                          cost_at_time: p.cost_price || 0
                        }];
                        setWizardSelections(newSelections);
                        
                        if (wizardStep < wizardProduct.modifier_groups.length - 1) {
                          setWizardStep(wizardStep + 1);
                        } else {
                          // Submit wizard logic (inlined to avoid state stale)
                          const totalOriginalPrice = newSelections.reduce((acc, sel) => acc + (sel.original_price || 0), 0);
                          const ratio = totalOriginalPrice > 0 ? (wizardProduct.price / totalOriginalPrice) : 1;
                          
                          let finalComboPrice = 0;
                          const finalModifiers = newSelections.map(sel => {
                            const prod = products.find(pr => pr.id === sel.product_id);
                            const adjustedPrice = sel.is_fixed_price ? sel.original_price : (sel.original_price * ratio);
                            finalComboPrice += adjustedPrice;
                            return {
                              modifier_item_id: sel.modifier_item_id,
                              product_id: sel.product_id,
                              product_name: prod?.name || 'Item',
                              price_at_time: adjustedPrice,
                              cost_at_time: sel.cost_at_time || 0
                            };
                          });

                          const comboInstance = {
                            ...wizardProduct,
                            id: `${wizardProduct.id}_${Date.now()}`,
                            base_product_id: wizardProduct.id,
                            __is_calculated: true,
                            price_at_time: finalComboPrice,
                            quantity: 1,
                            modifiers: finalModifiers
                          };

                          setCart([...cart, comboInstance]);
                          setWizardProduct(null);
                        }
                      }}
                      className={`relative w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left group ${
                        hasStock 
                          ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500 hover:bg-slate-800' 
                          : 'bg-slate-900/40 border-slate-800 opacity-40 grayscale cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${hasStock ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                          {p?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{p?.name}</p>
                          <div className="flex items-center gap-2">
                            {mItem.is_fixed_price && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Preço Fixo (X)</span>
                            )}
                            <span className="text-xs text-slate-500">{hasStock ? `${p.stock} em estoque` : 'Esgotado'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-emerald-400 font-bold">R$ {p?.price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer / Summary */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 shrink-0">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-slate-400 text-xs">Preço Base do Combo:</span>
                 <span className="text-white font-bold">R$ {wizardProduct.price.toFixed(2)}</span>
               </div>
               <p className="text-[10px] text-slate-500 leading-tight">Itens sem marcação (X) recebem desconto proporcional para chegar ao valor base.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-4 pb-6 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[35vh] flex flex-col">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <ShoppingCart size={16} className="text-blue-400" />
              Carrinho ({cart.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
            <div className="text-right">
              <span className="font-black text-emerald-400 text-xl tracking-tight">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto mb-3 flex-1 min-h-0 pr-1">
            {cart.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 line-clamp-1 flex-1 mr-2">{item.name}</span>
                  <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">-</button>
                    <span className="font-mono w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">+</button>
                  </div>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="pl-2 border-l border-slate-800 space-y-0.5">
                    {item.modifiers.map((m: any, mIdx: number) => (
                      <p key={mIdx} className="text-[10px] text-slate-500 flex justify-between">
                        <span>• {m.product_name || 'Opção selecionada'}</span>
                        <span>R$ {m.price_at_time?.toFixed(2)}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowCartConfirmModal(true)}
              disabled={isSubmittingOrder || cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-70 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all shrink-0 flex justify-center items-center gap-2"
          >
            {isSubmittingOrder ? <span className="animate-spin">⏳</span> : 'Confirmar Pedido'}
          </button>
        </div>
      )}

      

        {/* Modal de Confirmacao de Pedido - Visual de Ticket Impresso */}
        {showCartConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#fcfcfc] w-full max-w-[300px] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col font-mono text-black my-auto" style={{boxShadow: "0px 10px 30px rgba(0,0,0,0.5)"}}>
              
              {/* Topo do Ticket em zigue-zague simulando papel cortado (opcional, mas da charme) */}
              <div className="w-full h-3 bg-repeat-x" style={{backgroundImage: "radial-gradient(circle, #fcfcfc 4px, transparent 5px)", backgroundSize: "10px 10px", backgroundPosition: "top center", marginTop: "-5px"}}></div>

              <div className="p-4 pb-6 flex flex-col items-center">
                <div className="text-center font-black text-lg leading-tight mb-3">
                  BARAGEM<br/>
                  TICKET DE PRODU��O
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

              {/* Bot�es do Modal */}
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
        )}

        {/* Payment Modal */}

      {/* Merge Order Modal */}
      {/* Transfer Order Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Enviar para Fixa</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Todos os itens da comanda <span className="text-white font-bold">#{pulseira}</span> ser�o transferidos para a comanda fixa do cliente selecionado. Esta comanda ficar� livre.
            </p>

            {/* Corrigir n�mero da pulseira */}
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">?? Corrigir N�mero da Pulseira</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="N� correto"
                  defaultValue={pulseira}
                  id="transfer-pulseira-correction"
                  className="flex-1 bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-2 text-white font-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                  onChange={(e) => {
                    const el = document.getElementById('transfer-pulseira-correction') as HTMLInputElement;
                    if (el) el.value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  }}
                />
                <button
                  onClick={async () => {
                    const el = document.getElementById('transfer-pulseira-correction');
                    const novo = (el?.value || '').replace(/\D/g, '').padStart(4, '0');
                    if (!novo || novo === '0000') { alert('Digite um n�mero v�lido.'); return; }
                    if (novo === pulseira) { alert('O n�mero � o mesmo. Nada a corrigir.'); return; }
                    if (!window.confirm('Confirma a corre��o da pulseira?\n\nDe: #' + pulseira + '\nPara: #' + novo + '\n\nOs itens e a comanda ser�o renomeados para o novo n�mero.')) return;
                    setIsTransferModalOpen(false);
                    setTransferSearch('');
                    setTransferResults([]);
                    await handleUpdatePulseira(novo);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg font-bold text-sm transition-all"
                >
                  Corrigir
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">Use quando digitou o n�mero errado ao abrir a comanda.</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Buscar por nome ou n� da pulseira..."
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
                    key={`${person._type}-${person.id}`}
                    disabled={isTransferring}
                    onClick={async () => {
                      if (!currentOrder) return;
                      if (!confirm(`Enviar comanda #${pulseira} para ${person.name} (pulseira fixa #${person.fixed_pulseira})?`)) return;
                      setIsTransferring(true);
                      try {
                        const result = await api.transferOrder(currentOrder.id, person.fixed_pulseira);
                        setIsTransferModalOpen(false);
                        setView('home');
                        setPulseira('');
                        setCurrentOrder(null);
                        loadOpenOrders();
                        alert(`Comanda transferida para ${person.name} (#${result.destPulseira})!`);
                      } catch (err: any) {
                        alert(err.message || 'Erro ao transferir comanda.');
                      } finally {
                        setIsTransferring(false);
                      }
                    }}
                    className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-xl p-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${person._type === 'employee' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
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
                  <p className="text-center text-slate-500 text-sm py-4">Nenhum cliente/funcion�rio fixo encontrado.</p>
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
      )}

      {/* Fix Pulseira Modal */}
      {isFixModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">📌 Fixar Pulseira #{pulseira}</h3>
              <button onClick={() => setIsFixModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>

            {/* Seção: Corrigir número da pulseira */}
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">✏️ Corrigir Número da Pulseira</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Ex: 0042"
                  defaultValue={pulseira}
                  id="fix-pulseira-correction-input"
                  className="flex-1 bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2 text-white font-mono text-center text-xl tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                  onChange={(e) => {
                    const el = document.getElementById('fix-pulseira-correction-input') as HTMLInputElement;
                    if (el) el.value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('fix-pulseira-correction-input') as HTMLInputElement;
                    const novo = (el?.value || '').replace(/\D/g, '').padStart(4, '0');
                    if (!novo || novo === '0000') { alert('Digite um número válido.'); return; }
                    if (novo === pulseira) { alert('O número é o mesmo. Não há o que corrigir.'); return; }
                    if (!window.confirm(`Confirma a correção?\n\nDe: #${pulseira}\nPara: #${novo}\n\nA comanda será recarregada com o novo número.`)) return;
                    setIsFixModalOpen(false);
                    setPulseira(novo);
                    setCurrentOrder(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                >
                  Corrigir
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">Use se digitou o número errado ao abrir a comanda.</p>
            </div>

            {currentOrder?.is_fixed ? (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-sm text-slate-300 mb-4">Esta comanda já está fixada para:</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-900/20">
                    {currentOrder.customer_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">{currentOrder.customer_name}</p>
                    <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">
                      {currentOrder.fixed_type === 'employee' ? 'Funcionário' : 'Cliente Frequente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUnfixCurrent}
                  disabled={isLoading}
                  className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all"
                >
                  {isLoading ? 'Aguarde...' : 'Remover Vínculo Fixo'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Vincule esta pulseira permanentemente a um funcionário ou cliente frequente.</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={fixSearchTerm}
                    onChange={(e) => handleSearchFix(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>

                <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-2">
                  {fixResults.employees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleFixPulseira('employee', emp.id)}
                      className="w-full p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">EQUIPE</div>
                        <span className="font-bold text-slate-200 group-hover:text-white">{emp.name}</span>
                      </div>
                      <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {fixResults.customers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => handleFixPulseira('customer', cust.id)}
                      className="w-full p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">CLIENTE</div>
                        <span className="font-bold text-slate-200 group-hover:text-white">{cust.name}</span>
                      </div>
                      <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {fixSearchTerm.length >= 2 && fixResults.employees.length === 0 && fixResults.customers.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm italic">Nenhum resultado encontrado...</p>
                  )}
                  {fixSearchTerm.length < 2 && (
                    <p className="text-center text-slate-600 py-4 text-xs">Digite pelo menos 2 letras para buscar</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setIsFixModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Swap Modal */}
      {itemToSwap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Trocar Produto</h3>
                <p className="text-sm text-slate-400">Substituindo: <strong className="text-blue-400">{itemToSwap.product_name}</strong></p>
              </div>
              <button onClick={() => setItemToSwap(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Busque o novo produto (nome ou inicial)..."
                value={swapSearchTerm}
                onChange={(e) => setSwapSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {swapFilteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleSwapItem(product)}
                  className="w-full flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition-colors text-left"
                >
                  <div>
                    <p className="font-bold text-slate-200">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.category_name}</p>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">R$ {product.price.toFixed(2)}</span>
                </button>
              ))}
              {swapFilteredProducts.length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhum produto encontrado...</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stock Correction Modal */}
      {showStockCorrectionModal && selectedStockProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-bold text-amber-400 leading-tight">
                    {selectedStockProduct.name}
                  </h3>
                  <p className="text-sm text-slate-400">Estoque Baixo</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowStockCorrectionModal(false);
                  setSelectedStockProduct(null);
                  setOriginalCartProduct(null);
                }} 
                className="text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-6 text-center">
              <p className="text-sm text-slate-400">O sistema registra atualmente:</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {selectedStockProduct.stock} {selectedStockProduct.unit || 'un'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <span>📦</span> Tem mercadoria no estoque?
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="decimal"
                    placeholder="Quantidade"
                    value={newStockQuantity}
                    onChange={(e) => setNewStockQuantity(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder:text-slate-700"
                    autoFocus
                  />
                  <button
                    onClick={handleConfirmStockCorrection}
                    disabled={isLoading}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? '...' : 'Confirmar'}
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 italic pt-2">
                * Se não tiver mercadoria no estoque, feche este aviso para cancelar a venda.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


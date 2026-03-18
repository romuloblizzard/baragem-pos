import { supabase } from './supabase';

export const api = {
  // Categories
  getCategories: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data;
  },
  saveCategory: async (category: any) => {
    if (category.id) {
      const { data, error } = await supabase.from('categories').update({ name: category.name }).eq('id', category.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('categories').insert({ name: category.name }).select().single();
      if (error) throw error;
      return data;
    }
  },
  deleteCategory: async (id: number) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Products
  getProducts: async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .eq('active', true)
      .order('name');
    if (error) throw error;

    const formattedProducts = products.map((p: any) => ({
      ...p,
      category_name: p.categories?.name || null,
      ingredients: []
    }));

    const compositionIds = formattedProducts.filter((p: any) => p.type === 'composition').map((p: any) => p.id);
    if (compositionIds.length > 0) {
      const { data: ingredientsData, error: ingError } = await supabase
        .from('product_ingredients')
        .select(`
          *,
          products!product_ingredients_ingredient_id_fkey (name, cost_price, stock, unit)
        `)
        .in('product_id', compositionIds);

      if (!ingError && ingredientsData) {
        for (const p of formattedProducts) {
          if (p.type === 'composition') {
            p.ingredients = ingredientsData.filter((i: any) => i.product_id === p.id).map((i: any) => ({
              ...i,
              ingredient_name: i.products?.name,
              ingredient_cost: i.products?.cost_price || 0,
              ingredient_stock: i.products?.stock || 0,
              ingredient_unit: i.products?.unit || 'un'
            }));

            // Dynamic cost: sum of (ingredient cost × quantity used)
            if (p.ingredients.length > 0) {
              p.cost_price = p.ingredients.reduce((sum: number, ing: any) => {
                return sum + ((ing.ingredient_cost || 0) * (ing.quantity || 0));
              }, 0);

              // Dynamic stock: min of (ingredient stock / quantity needed), floored
              p.stock = Math.floor(Math.min(
                ...p.ingredients.map((ing: any) => {
                  if (!ing.quantity || ing.quantity <= 0) return 0;
                  return (ing.ingredient_stock || 0) / ing.quantity;
                })
              ));
            }
          }
        }
      }
    }

    return formattedProducts;
  },
  saveProduct: async (product: any) => {
    const { ingredients, category_name, child_product_ids, observation, categories, ...productData } = product;

    // In case we want to explicitly save observation into productData
    if (observation !== undefined) {
      productData.observation = observation;
    }

    // Remove any non-database fields that might have been added dynamically
    delete productData.ingredient_cost;
    delete productData.ingredient_stock;
    delete productData.ingredient_unit;
    delete productData.ingredient_name;

    let productId = product.id;

    if (productId) {
      const { error } = await supabase.from('products').update(productData).eq('id', productId);
      if (error) throw error;

      if (product.type === 'composition' && ingredients) {
        const { error: delError } = await supabase.from('product_ingredients').delete().eq('product_id', productId);
        if (delError) throw delError;

        const validIngredients = ingredients.filter((ing: any) => ing.ingredient_id && !isNaN(ing.ingredient_id));
        if (validIngredients.length > 0) {
          const ingData = validIngredients.map((ing: any) => ({
            product_id: productId,
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 1
          }));
          const { error: insError } = await supabase.from('product_ingredients').insert(ingData);
          if (insError) throw insError;
        }
      }

      if (product.type === 'variable' && child_product_ids !== undefined) {
        // Remove those that are no longer selected
        await supabase.from('products').update({ parent_id: null }).eq('parent_id', productId);
        // Link the selected ones
        if (child_product_ids.length > 0) {
          await supabase.from('products').update({ parent_id: productId }).in('id', child_product_ids);
        }
      }
    } else {
      // Strip undefined/null id so the DB can auto-generate it
      const { id, ...newProductData } = productData;
      const { data, error } = await supabase.from('products').insert(newProductData).select().single();
      if (error) throw error;
      productId = data.id;

      if (product.type === 'composition' && ingredients) {
        const validIngredients = ingredients.filter((ing: any) => ing.ingredient_id && !isNaN(ing.ingredient_id));
        if (validIngredients.length > 0) {
          const ingData = validIngredients.map((ing: any) => ({
            product_id: productId,
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 1
          }));
          const { error: insError } = await supabase.from('product_ingredients').insert(ingData);
          if (insError) throw insError;
        }
      }

      if (product.type === 'variable' && child_product_ids !== undefined) {
        if (child_product_ids.length > 0) {
          await supabase.from('products').update({ parent_id: productId }).in('id', child_product_ids);
        }
      }
    }
    return { id: productId };
  },
  deleteProduct: async (id: number) => {
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Customers
  searchCustomers: async (q: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${q}%,document.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(5);
    if (error) throw error;
    return data;
  },
  createCustomer: async (data: any) => {
    // Prevent empty strings from triggering unique constraints
    const cleanData = { ...data };
    if (!cleanData.document || cleanData.document.trim() === '') {
      delete cleanData.document;
    }
    if (!cleanData.phone || cleanData.phone.trim() === '') {
      delete cleanData.phone;
    }

    const { data: customer, error } = await supabase.from('customers').insert(cleanData).select().single();
    if (error) {
      if (error.code === '23505') throw new Error('Documento já cadastrado');
      throw error;
    }
    return customer;
  },

  // Orders
  getOrders: async (status?: string, period?: string) => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    if (period) {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      if (period === 'weekly') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
      } else if (period === 'monthly') {
        startDate.setDate(1);
      } else if (period === 'yearly') {
        startDate.setMonth(0, 1);
      }
      query = query.gte('created_at', startDate.toISOString());
    }

    // Hardcode exclusion of stubborn test orders so they disappear from UI
    query = query.not('id', 'in', '(6,7)');

    const { data: orders, error } = await query;
    if (error) throw error;

    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`*, products (name)`)
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    return orders.map((order: any) => ({
      ...order,
      items: items.filter(i => i.order_id === order.id).map((i: any) => ({ ...i, product_name: i.products?.name }))
    }));
  },
  getOrder: async (pulseira: string) => {
    const { data: order, error } = await supabase.from('orders').select('*').eq('pulseira', pulseira).eq('status', 'open').maybeSingle();
    if (error) throw error;
    if (!order) throw new Error('Order not found');

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`*, products(name)`)
      .eq('order_id', order.id);
    if (itemsError) throw itemsError;

    return {
      ...order,
      items: items.map((i: any) => ({ ...i, product_name: i.products?.name }))
    };
  },
  createOrder: async (data: { pulseira: string, customer_name: string, customer_phone?: string, customer_id?: number }) => {
    const { data: existing } = await supabase.from('orders').select('id').eq('pulseira', data.pulseira).eq('status', 'open').maybeSingle();
    if (existing) throw new Error('Order already open for this pulseira');

    const { data: order, error } = await supabase.from('orders').insert(data).select().single();
    if (error) throw error;
    return order;
  },
  addOrderItems: async (orderId: number, items: { id: number, quantity: number }[]) => {
    // 1. Fetch all product details needed for price_at_time in a single query
    const productIds = items.map(i => i.id);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, price, cost_price')
      .in('id', productIds);

    if (prodError) throw prodError;

    // 2. Prepare bulk insert array
    const insertData = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) throw new Error(`Product ${item.id} not found`);
      return {
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: product.price,
        cost_at_time: product.cost_price || 0
      };
    });

    // 3. Bulk insert into order_items
    const { error } = await supabase.from('order_items').insert(insertData);
    if (error) throw error;

    return { success: true };
  },
  removeOrderItem: async (orderId: number, itemId: number) => {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId).eq('order_id', orderId);
    if (error) throw error;
    return { success: true };
  },
  payOrder: async (orderId: number, amount: number, method: string) => {
    const { error: txError } = await supabase.from('transactions').insert({
      order_id: orderId,
      amount,
      method
    });
    if (txError) throw txError;

    const { error: updError } = await supabase.from('orders').update({
      status: 'paid',
      closed_at: new Date().toISOString()
    }).eq('id', orderId);
    if (updError) throw updError;

    return { success: true };
  },

  // Stats
  getStats: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily') => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday as start of week
      startDate.setDate(diff);
    } else if (period === 'monthly') {
      startDate.setDate(1);
    } else if (period === 'yearly') {
      startDate.setMonth(0, 1);
    }

    // Hardcode exclusion of test orders from transactions query to fix revenue
    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, order_id')
      .gte('created_at', startDate.toISOString())
      .not('order_id', 'in', '(6,7)');
    const totalRevenue = txData ? txData.reduce((acc, tx) => acc + Number(tx.amount), 0) : 0;

    const { count: openOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'open').not('id', 'in', '(6,7)');

    // Contar fechadas no período para o ticket médio (ou todos do período)
    const { count: paidOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid').gte('closed_at', startDate.toISOString()).not('id', 'in', '(6,7)');

    return {
      totalRevenue,
      openOrdersCount: openOrdersCount || 0,
      paidOrdersCount: paidOrdersCount || 0
    };
  },

  // Settings
  getSettings: async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const settingsObj = data.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return settingsObj;
  },
  saveSettings: async (settings: any) => {
    const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;
    return { success: true };
  },

  // Cashier
  getCashierStatus: async () => {
    const { data: currentSession } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentSession) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('method', 'cash')
        .gte('created_at', currentSession.opened_at);

      const totalCashSales = txData ? txData.reduce((acc, tx) => acc + Number(tx.amount), 0) : 0;

      return {
        status: 'open',
        session: {
          ...currentSession,
          current_cash_sales: totalCashSales,
          current_balance: Number(currentSession.initial_balance) + totalCashSales
        }
      };
    } else {
      const { data: lastSession } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { status: 'closed', last_session: lastSession || null };
    }
  },
  openCashier: async (initialBalance: number) => {
    const { data: openSession } = await supabase.from('cashier_sessions').select('*').eq('status', 'open').maybeSingle();
    if (openSession) throw new Error("Cashier is already open");

    const { data, error } = await supabase.from('cashier_sessions').insert({ initial_balance: initialBalance }).select().single();
    if (error) throw error;
    return { success: true, id: data.id };
  },
  closeCashier: async (amortization: number) => {
    const { data: currentSession } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentSession) throw new Error("No open cashier session");

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('method', 'cash')
      .gte('created_at', currentSession.opened_at);

    const totalCashSales = txData ? txData.reduce((acc, tx) => acc + Number(tx.amount), 0) : 0;
    const finalBalance = Number(currentSession.initial_balance) + totalCashSales - (amortization || 0);

    const { data: closedSession, error } = await supabase.from('cashier_sessions').update({
      closed_at: new Date().toISOString(),
      total_cash_sales: totalCashSales,
      amortization: amortization || 0,
      final_balance: finalBalance,
      status: 'closed'
    }).eq('id', currentSession.id).select().single();

    if (error) throw error;
    return { success: true, session: closedSession };
  },

  // Auth & Employees
  loginWithPin: async (pin: string, force: boolean = false) => {
    let deviceId = localStorage.getItem('pos_device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pos_device_id', deviceId);
    }

    // 1. Authenticate with Supabase Auth natively using the mapped fake email
    const fakeEmail = `${pin}@baragem.local`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: pin,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: 'PIN Incorreto ou bloqueio por muitas tentativas.' };
    }

    // 2. Fetch the corresponding Employee to get Role and Name
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('role, name, id, current_device_id')
      .eq('auth_id', authData.user?.id)
      .single();

    if (empError || !empData) {
      await supabase.auth.signOut();
      return { success: false, error: 'Usuário não encontrado nos registros do sistema.' };
    }

    // 3. Multi-device Exclusivity Check
    if (empData.current_device_id && empData.current_device_id !== deviceId && !force) {
      await supabase.auth.signOut(); // Undo the auth login since we are blocking until forced
      return {
        success: false,
        requiresForce: true,
        error: 'Este usuário já está ativo em outro dispositivo.'
      };
    }

    // 4. Update the tracker to claim this device
    await supabase.from('employees').update({ current_device_id: deviceId }).eq('id', empData.id);

    return {
      success: true,
      role: empData.role,
      name: empData.name,
      employee_id: empData.id
    };
  },

  logout: async (employeeId?: string) => {
    if (employeeId) {
      await supabase.from('employees').update({ current_device_id: null }).eq('id', employeeId);
    }
    await supabase.auth.signOut();
  },

  subscribeToEviction: (employeeId: string, currentDeviceId: string, onEvict: () => void) => {
    const channel = supabase.channel(`employee-${employeeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'employees',
        filter: `id=eq.${employeeId}`,
      }, (payload) => {
        const newDeviceId = payload.new.current_device_id;
        if (newDeviceId && newDeviceId !== currentDeviceId) {
          onEvict();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  getEmployees: async () => {
    const { data, error } = await supabase.from('employees').select('*').order('name');
    if (error) throw error;
    return data;
  },

  saveEmployee: async (employee: any) => {
    if (employee.id) {
      const { error } = await supabase.from('employees').update(employee).eq('id', employee.id);
      if (error) throw error;
    } else {
      const { id, ...newEmployee } = employee;
      const { error } = await supabase.from('employees').insert([newEmployee]);
      if (error) throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  },

  // Suppliers
  getSuppliers: async () => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data;
  },
  saveSupplier: async (supplier: any) => {
    if (supplier.id) {
      const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    }
  },
  deleteSupplier: async (id: number) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Purchase Orders
  getPurchaseOrders: async () => {
    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select(`*, products (name, unit)`)
      .in('purchase_order_id', orderIds);

    if (itemsError) throw itemsError;

    return orders.map((order: any) => ({
      ...order,
      supplier_name: order.suppliers?.name || 'Fornecedor avulso',
      items: items.filter(i => i.purchase_order_id === order.id).map((i: any) => ({
        ...i,
        system_product_name: i.products?.name,
        system_product_unit: i.products?.unit
      }))
    }));
  },
  savePurchaseOrder: async (orderData: any, items: any[]) => {
    let orderId = orderData.id;
    let order;

    if (orderId) {
      // Update existing order
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          supplier_id: orderData.supplier_id || null,
          invoice_number: orderData.invoice_number,
          total_amount: orderData.total_amount,
          freight_amount: orderData.freight_amount,
          notes: orderData.notes,
          status: 'pending'
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      order = data;

      // Delete old items so we can insert new ones
      await supabase.from('purchase_order_items').delete().eq('purchase_order_id', orderId);

    } else {
      // Insert new order
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: orderData.supplier_id || null,
          invoice_number: orderData.invoice_number,
          total_amount: orderData.total_amount,
          freight_amount: orderData.freight_amount,
          notes: orderData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      order = data;
      orderId = order.id;
    }

    // Insert items
    if (items && items.length > 0) {
      const insertItems = items.map(item => ({
        purchase_order_id: orderId,
        raw_name: item.raw_name,
        raw_quantity: item.raw_quantity,
        raw_unit_price: item.raw_unit_price
      }));
      const { error: itemsError } = await supabase.from('purchase_order_items').insert(insertItems);
      if (itemsError) throw itemsError;
    }

    return order;
  },
  reconcilePurchaseOrder: async (orderId: number, reconciledItems: any[]) => {
    // 1. Update purchase_order_items with reconciliation data
    for (const item of reconciledItems) {
      if (!item.product_id) continue;

      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .update({
          product_id: item.product_id,
          reconciled_quantity: item.reconciled_quantity,
          reconciled_unit_cost: item.reconciled_unit_cost
        })
        .eq('id', item.id);

      if (itemError) throw itemError;

      // 2. Fetch current product with category
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('stock, cost_price, stock_bottles, bottle_volume_ml, categories(name)')
        .eq('id', item.product_id)
        .single();

      if (prodError) throw prodError;

      const categoryName = (product as any).categories?.name;
      const isBottle = categoryName === 'Garrafa';

      // 3. Calculate new weighted average cost and new stock
      const currentStock = parseFloat(product.stock) || 0;
      const currentCost = parseFloat(product.cost_price) || 0;

      const addedStock = parseFloat(item.reconciled_quantity) || 0;
      const addedCost = parseFloat(item.reconciled_unit_cost) || 0;

      let updateData: any = {};

      if (isBottle) {
        // Garrafa: reconciled_quantity = garrafas inteiras
        const bottleVolume = parseFloat(item.bottle_volume_ml) || parseFloat(product.bottle_volume_ml) || 0;
        const addedMl = addedStock * bottleVolume;
        const totalNewMl = currentStock + addedMl;
        const currentBottles = parseFloat(product.stock_bottles) || 0;
        const totalNewBottles = currentBottles + addedStock;

        // Weighted average cost per ml
        let newCost = currentCost;
        if (totalNewMl > 0) {
          const currentVal = currentStock * currentCost;
          const addedVal = addedMl * (addedCost / (bottleVolume || 1)); // cost per ml
          newCost = (currentVal + addedVal) / totalNewMl;
        } else if (addedMl > 0) {
          newCost = addedCost / (bottleVolume || 1);
        }

        updateData = {
          stock: totalNewMl,
          stock_bottles: totalNewBottles,
          bottle_volume_ml: bottleVolume,
          cost_price: newCost
        };
      } else {
        // Produto normal
        const totalNewStock = currentStock + addedStock;
        let newCost = currentCost;
        if (totalNewStock > 0) {
          const currentVal = currentStock * currentCost;
          const addedVal = addedStock * addedCost;
          newCost = (currentVal + addedVal) / totalNewStock;
        } else if (addedStock > 0) {
          newCost = addedCost;
        }

        updateData = {
          stock: totalNewStock,
          cost_price: newCost
        };
      }

      // 4. Update product
      const { error: updateProdError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', item.product_id);

      if (updateProdError) throw updateProdError;
    }

    // 5. Update purchase order status to reconciled
    const { error: orderError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'reconciled',
        reconciled_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    return { success: true };
  },

  deletePurchaseOrder: async (orderId: number) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  },

  getProductPurchaseHistory: async (productId: number) => {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .select(`
        *,
        purchase_orders (
          created_at,
          invoice_number,
          suppliers (name)
        )
      `)
      .eq('product_id', productId)
      .order('id', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      date: item.purchase_orders?.created_at,
      supplier_name: item.purchase_orders?.suppliers?.name || 'Fornecedor avulso',
      invoice_number: item.purchase_orders?.invoice_number,
      quantity: item.reconciled_quantity,
      unit_cost: item.reconciled_unit_cost,
      raw_name: item.raw_name
    }));
  }
};

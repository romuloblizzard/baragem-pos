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

    const compositionIds = formattedProducts.filter(p => p.type === 'composition').map(p => p.id);
    if (compositionIds.length > 0) {
      const { data: ingredientsData, error: ingError } = await supabase
        .from('product_ingredients')
        .select(`
          *,
          products (name)
        `)
        .in('product_id', compositionIds);

      if (!ingError && ingredientsData) {
        for (const p of formattedProducts) {
          if (p.type === 'composition') {
            p.ingredients = ingredientsData.filter((i: any) => i.product_id === p.id).map((i: any) => ({
              ...i,
              ingredient_name: i.products?.name
            }));
          }
        }
      }
    }

    return formattedProducts;
  },
  saveProduct: async (product: any) => {
    const { ingredients, category_name, ...productData } = product;

    let productId = product.id;

    if (productId) {
      const { error } = await supabase.from('products').update(productData).eq('id', productId);
      if (error) throw error;

      if (product.type === 'composition' && ingredients) {
        await supabase.from('product_ingredients').delete().eq('product_id', productId);
        const ingData = ingredients.map((ing: any) => ({
          product_id: productId,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));
        await supabase.from('product_ingredients').insert(ingData);
      }
    } else {
      const { data, error } = await supabase.from('products').insert(productData).select().single();
      if (error) throw error;
      productId = data.id;

      if (product.type === 'composition' && ingredients) {
        const ingData = ingredients.map((ing: any) => ({
          product_id: productId,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));
        await supabase.from('product_ingredients').insert(ingData);
      }
    }
    return { id: productId };
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
  getOrders: async (status?: string) => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

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

    const { data: txData } = await supabase.from('transactions').select('amount').gte('created_at', startDate.toISOString());
    const totalRevenue = txData ? txData.reduce((acc, tx) => acc + Number(tx.amount), 0) : 0;

    const { count: openOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'open');

    // Contar fechadas no período para o ticket médio (ou todos do período)
    const { count: paidOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid').gte('closed_at', startDate.toISOString());

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
  loginWithPin: async (pin: string) => {
    // Generate a simple identifier for the device/browser for rate limiting
    let deviceId = localStorage.getItem('pos_device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pos_device_id', deviceId);
    }

    // Call the Supabase RPC function we created
    const { data, error } = await supabase.rpc('login_with_pin', {
      entered_pin: pin,
      client_identifier: deviceId
    });

    if (error) throw error;
    return data; // Returns { success, error, role, name, employee_id }
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
      const { error } = await supabase.from('employees').insert([employee]);
      if (error) throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  }
};

import { supabase } from './supabase';

export const api = {
  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories!parent_id(id, name)')
      .order('name');
    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      parent_name: c.parent?.name || null,
    }));
  },
  saveCategory: async (category: any) => {
    const payload: any = {
      name: category.name,
      parent_id: category.parent_id || null,
      show_on_waiter: category.show_on_waiter ?? true,
    };
    if (category.id) {
      const { data, error } = await supabase.from('categories').update(payload).eq('id', category.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw error;
      return data;
    }
  },
  deleteCategory: async (id: number) => {
    // First, clear category from any products using it (avoid orphaned references)
    await supabase.from('products').update({ category_id: null }).eq('category_id', id);
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
        categories (name),
        product_batches (*)
      `)
      .eq('active', true)
      .order('name');
    if (error) throw error;

    const formattedProducts = products.map((p: any) => ({
      ...p,
      category_name: p.categories?.name || null,
      ingredients: [],
      modifier_groups: [],
      batches: p.product_batches || []
    }));

    // Fetch Modifier Groups and Items
    const { data: modifierData, error: modError } = await supabase
      .from('product_modifier_groups')
      .select(`
        *,
        product_modifier_items (
          *,
          linked_product:products (id, name, price, cost_price, stock, unit)
        )
      `)
      .order('step_order', { ascending: true });

    if (!modError && modifierData) {
      for (const p of formattedProducts) {
        p.modifier_groups = modifierData.filter((mg: any) => mg.product_id === p.id);
      }
    }

    const compositionIds = formattedProducts.filter((p: any) => p.type === 'composition').map((p: any) => p.id);
    if (compositionIds.length > 0) {
      const { data: ingredientsData, error: ingError } = await supabase
        .from('product_ingredients')
        .select(`
          *,
          products!product_ingredients_ingredient_id_fkey (
            name, cost_price, stock, unit, bottle_volume_ml, categories(name)
          )
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
              ingredient_unit: i.products?.unit || 'un',
              ingredient_category: i.products?.categories?.name,
              ingredient_bottle_volume_ml: i.products?.bottle_volume_ml || 0
            }));

            // Dynamic cost: sum of (ingredient cost × quantity used)
            if (p.ingredients.length > 0) {
              p.cost_price = p.ingredients.reduce((sum: number, ing: any) => {
                let actualQty = ing.quantity || 0;
                if (ing.ingredient_category === 'Garrafa' && ing.ingredient_bottle_volume_ml) {
                  actualQty = actualQty / ing.ingredient_bottle_volume_ml;
                }
                return sum + ((ing.ingredient_cost || 0) * actualQty);
              }, 0);

              // Dynamic stock: min of (ingredient stock / quantity needed), floored
              p.stock = Math.floor(Math.min(
                ...p.ingredients.map((ing: any) => {
                  let actualQty = ing.quantity || 0;
                  if (ing.ingredient_category === 'Garrafa' && ing.ingredient_bottle_volume_ml) {
                    actualQty = actualQty / ing.ingredient_bottle_volume_ml;
                  }
                  if (actualQty <= 0) return 0;
                  return (ing.ingredient_stock || 0) / actualQty;
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
    const { ingredients, modifier_groups, batches, category_name, child_product_ids, observation, categories, ...productData } = product;

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

      // Handle Modifiers
      if (modifier_groups) {
        // Simple strategy: delete all and re-insert
        await supabase.from('product_modifier_groups').delete().eq('product_id', productId);
        
        for (const mg of modifier_groups) {
          const { data: group, error: groupError } = await supabase
            .from('product_modifier_groups')
            .insert({
              product_id: productId,
              name: mg.name,
              step_order: mg.step_order || 1,
              min_select: mg.min_select || 1,
              max_select: mg.max_select || 1
            })
            .select()
            .single();
          
          if (!groupError && group && mg.product_modifier_items) {
            const itemsToInsert = mg.product_modifier_items
              .filter((i: any) => i.linked_product_id)
              .map((i: any) => ({
                group_id: group.id,
                linked_product_id: i.linked_product_id,
                is_fixed_price: i.is_fixed_price || false,
                extra_price: parseFloat(i.extra_price) || 0,
                quantity: parseFloat(i.quantity) || 1
              }));
            
            if (itemsToInsert.length > 0) {
              await supabase.from('product_modifier_items').insert(itemsToInsert);
            }
          }
        }
      }

      // Handle batches
      if (batches) {
        // Delete existing batches for this product first (to sync)
        await supabase.from('product_batches').delete().eq('product_id', productId);
        if (batches.length > 0) {
          const batchData = batches.map((b: any) => ({
            product_id: productId,
            quantity: parseFloat(b.qty) || 0,
            unit_size: parseFloat(b.size) || 1,
            total_price: parseFloat(b.totalPrice) || 0,
            remaining_stock: (parseFloat(b.qty) || 0) * (parseFloat(b.size) || 1)
          }));
          const { error: batchError } = await supabase.from('product_batches').insert(batchData);
          if (batchError) throw batchError;
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

      // Handle Modifiers for new product
      if (modifier_groups) {
        for (const mg of modifier_groups) {
          const { data: group, error: groupError } = await supabase
            .from('product_modifier_groups')
            .insert({
              product_id: productId,
              name: mg.name,
              step_order: mg.step_order || 1,
              min_select: mg.min_select || 1,
              max_select: mg.max_select || 1
            })
            .select()
            .single();
          
          if (!groupError && group && mg.product_modifier_items) {
            const itemsToInsert = mg.product_modifier_items
              .filter((i: any) => i.linked_product_id)
              .map((i: any) => ({
                group_id: group.id,
                linked_product_id: i.linked_product_id,
                is_fixed_price: i.is_fixed_price || false,
                extra_price: parseFloat(i.extra_price) || 0,
                quantity: parseFloat(i.quantity) || 1
              }));
            
            if (itemsToInsert.length > 0) {
              await supabase.from('product_modifier_items').insert(itemsToInsert);
            }
          }
        }
      }

      if (product.type === 'variable' && child_product_ids !== undefined) {
        if (child_product_ids.length > 0) {
          await supabase.from('products').update({ parent_id: productId }).in('id', child_product_ids);
        }
      }

      // Handle batches for new product
      if (batches && batches.length > 0) {
        const batchData = batches.map((b: any) => ({
          product_id: productId,
          quantity: parseFloat(b.qty) || 0,
          unit_size: parseFloat(b.size) || 1,
          total_price: parseFloat(b.totalPrice) || 0,
          remaining_stock: (parseFloat(b.qty) || 0) * (parseFloat(b.size) || 1)
        }));
        const { error: batchError } = await supabase.from('product_batches').insert(batchData);
        if (batchError) throw batchError;
      }
    }
    return { id: productId };
  },
  deleteProduct: async (id: number) => {
    // 1. Mark product as inactive
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) throw error;

    // 2. Auto-clean from digital menu config
    try {
      const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'digital_menu_config').maybeSingle();
      if (settingsData?.value) {
        const config = JSON.parse(settingsData.value);
        let changed = false;

        config.pages = config.pages.map((page: any) => {
          const newGroups = page.groups.map((group: any) => {
            const before = group.products.length;
            group.products = group.products.filter((p: any) => p.id !== id);
            if (group.products.length !== before) changed = true;
            return group;
          });
          return { ...page, groups: newGroups };
        });

        if (changed) {
          await supabase.from('settings').upsert(
            [{ key: 'digital_menu_config', value: JSON.stringify(config) }],
            { onConflict: 'key' }
          );
        }
      }
    } catch (menuErr) {
      // Don't block the deletion if menu cleanup fails
      console.warn('Could not clean product from menu config:', menuErr);
    }

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
    if (!cleanData.fixed_pulseira || cleanData.fixed_pulseira.trim() === '') {
      delete cleanData.fixed_pulseira;
    } else {
      cleanData.fixed_pulseira = cleanData.fixed_pulseira.replace(/\D/g, '').padStart(4, '0');
    }

    const { data: customer, error } = await supabase.from('customers').insert(cleanData).select().single();
    if (error) {
      if (error.code === '23505') throw new Error('Documento ou Pulseira Fixa já cadastrados');
      throw error;
    }
    return customer;
  },

  saveCustomer: async (customer: any) => {
    const cleanData = { ...customer };
    if (!cleanData.fixed_pulseira || cleanData.fixed_pulseira.trim() === '') {
      cleanData.fixed_pulseira = null;
    } else {
      cleanData.fixed_pulseira = cleanData.fixed_pulseira.replace(/\D/g, '').padStart(4, '0');
    }
    const { error } = await supabase.from('customers').update(cleanData).eq('id', customer.id);
    if (error) {
       if (error.code === '23505') throw new Error('Pulseira Fixa já está em uso');
       throw error;
    }
  },
  getFixedCustomers: async () => {
    const { data, error } = await supabase.from('customers').select('*').not('fixed_pulseira', 'is', null).order('name');
    if (error) throw error;
    return data;
  },
  deleteCustomer: async (id: number) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  getCustomerHistory: async (customerId: number, startDate?: string, endDate?: string) => {
    let oq = supabase.from('orders').select('*, items:order_items(quantity, price_at_time, products(name))').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (startDate) oq = oq.gte('created_at', startDate);
    if (endDate) oq = oq.lte('created_at', endDate);
    
    // Also include test fixed orders if manually linked by name
    const [ordersRes] = await Promise.all([oq]);
    if (ordersRes.error) throw ordersRes.error;

    return {
      orders: ordersRes.data || [],
      transactions: [] // Transactions are usually linked to employees, but we could fetch them for the order later if needed
    };
  },

  // Orders
  getNextPulseira: async (): Promise<string> => {
    const { data: orders } = await supabase
      .from('orders')
      .select('pulseira')
      .eq('status', 'open');
    const used = new Set((orders || []).map((o: any) => o.pulseira));
    for (let i = 1; i <= 9974; i++) {
      const p = String(i).padStart(4, '0');
      if (!used.has(p)) return p;
    }
    return '0001';
  },

  getOpenOrdersSummary: async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, pulseira, customer_name, created_at')
      .eq('status', 'open')
      .not('id', 'in', '(6,7)')
      .order('pulseira', { ascending: true });
    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, quantity, price_at_time')
      .in('order_id', orderIds);
    if (itemsError) throw itemsError;

    return orders.map((order: any) => {
      const orderItems = (items || []).filter(i => i.order_id === order.id);
      const total = orderItems.reduce((acc: number, i: any) => acc + (i.price_at_time * i.quantity), 0);
      const itemsCount = orderItems.reduce((acc: number, i: any) => acc + i.quantity, 0);
      return {
        id: order.id,
        pulseira: order.pulseira,
        customer_name: order.customer_name,
        total,
        items_count: itemsCount,
        created_at: order.created_at
      };
    });
  },
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
      .select(`
        *, 
        products (name),
        modifiers:order_item_modifiers(
          *,
          product:products(name)
        )
      `)
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    const { data: txs, error: txsError } = await supabase
      .from('transactions')
      .select('*')
      .in('order_id', orderIds);

    if (txsError) throw txsError;

    return orders.map((order: any) => ({
      ...order,
      transactions: (txs || []).filter(t => t.order_id === order.id),
      items: items.filter(i => i.order_id === order.id).map((i: any) => ({ 
        ...i, 
        product_name: i.products?.name,
        modifiers: i.modifiers.map((m: any) => ({
          ...m,
          product_name: m.product?.name
        }))
      }))
    }));
  },
  getOrder: async (pulseira: string) => {
    const { data: order, error } = await supabase.from('orders').select('*').eq('pulseira', pulseira).eq('status', 'open').maybeSingle();
    if (error) throw error;
    if (!order) throw new Error('Order not found');

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *, 
        products(name),
        modifiers:order_item_modifiers(
          *,
          product:products(name)
        )
      `)
      .eq('order_id', order.id);
    if (itemsError) throw itemsError;

    // Resolve fixed info to ensure latest names/discounts are present
    const owner = await api.findFixedOwner(pulseira);

    return {
      ...order,
      customer_name: owner?.name || order.customer_name,
      discount_percentage: owner?.discount_percentage ?? order.discount_percentage,
      discount_cap: owner?.discount_cap ?? order.discount_cap,
      is_fixed: !!owner,
      fixed_type: owner?.type,
      items: items.map((i: any) => ({ 
        ...i, 
        product_name: i.products?.name,
        modifiers: i.modifiers.map((m: any) => ({
          ...m,
          product_name: m.product?.name
        }))
      }))
    };
  },
  findFixedOwner: async (pulseira: string) => {
    // Normaliza: busca tanto "0100" quanto "100" para cobrir inconsistências no banco
    const padded = pulseira.replace(/\D/g, '').padStart(4, '0');
    const unpadded = String(parseInt(pulseira));
    const variants = Array.from(new Set([padded, unpadded]));

    // 1. Check Employees
    const { data: emps } = await supabase
      .from('employees')
      .select('id, name, discount_percentage, discount_cap')
      .in('fixed_pulseira', variants);
    const emp = emps?.[0];
    if (emp) return { type: 'employee', id: emp.id, name: emp.name, discount_percentage: emp.discount_percentage, discount_cap: emp.discount_cap };

    // 2. Check Customers
    const { data: custs } = await supabase
      .from('customers')
      .select('id, name')
      .in('fixed_pulseira', variants);
    const cust = custs?.[0];
    if (cust) return { type: 'customer', id: cust.id, name: cust.name };

    return null;
  },
  createOrder: async (data: { pulseira: string, customer_name: string, customer_phone?: string, customer_id?: number, discount_percentage?: number, discount_cap?: number }) => {
    const { data: existing } = await supabase.from('orders').select('id').eq('pulseira', data.pulseira).eq('status', 'open').maybeSingle();
    if (existing) throw new Error('Order already open for this pulseira');

    // Auto-detect if this pulseira belongs to someone fixed if donor is empty or not provided
    let finalData = { ...data };
    
    // Range check for 9975-9999
    const pNum = parseInt(data.pulseira);
    const isEmployeeRange = pNum >= 9975 && pNum <= 9999;

    const owner = await api.findFixedOwner(data.pulseira);
    if (owner) {
      finalData.customer_name = owner.name;
      if (owner.type === 'customer') finalData.customer_id = owner.id as any;
      if (owner.type === 'employee') {
        finalData.discount_percentage = owner.discount_percentage;
        finalData.discount_cap = owner.discount_cap;
      }
    } else if (isEmployeeRange) {
      // In this range, if no owner found, we might block or handle differently
      // The user wants it restricted.
      console.log("No fixed owner for employee range pulseira");
    }

      const employee_id = localStorage.getItem('pos_employee_id');
      const attendant_name = localStorage.getItem('pos_employee_name');
      const enrichedData = { ...finalData, employee_id: employee_id || null, attendant_name: attendant_name || 'Desconhecido' };

    const { data: order, error } = await supabase.from('orders').insert(enrichedData).select().single();
    if (error) throw error;
    return order;
  },
  fixPulseira: async (pulseira: string, ownerType: 'employee' | 'customer', ownerId: string | number) => {
    const table = ownerType === 'employee' ? 'employees' : 'customers';
    const { error } = await supabase.from(table).update({ fixed_pulseira: pulseira }).eq('id', ownerId);
    if (error) {
      if (error.code === '23505') throw new Error('Esta pulseira já está fixada para outra pessoa.');
      throw error;
    }
    return { success: true };
  },
  unfixPulseira: async (ownerType: 'employee' | 'customer', ownerId: string | number) => {
    const table = ownerType === 'employee' ? 'employees' : 'customers';
    const { error } = await supabase.from(table).update({ fixed_pulseira: null }).eq('id', ownerId);
    if (error) throw error;
    return { success: true };
  },
  addOrderItems: async (orderId: number, items: any[]) => {
    // Atualiza o atendente da comanda com o garçom ativo
    const employee_id = localStorage.getItem('pos_employee_id');
    const attendant_name = localStorage.getItem('pos_employee_name');
    if (employee_id || attendant_name) {
      await supabase.from('orders').update({
        employee_id: employee_id || null,
        attendant_name: attendant_name || 'Desconhecido'
      }).eq('id', orderId);
    }

    // 1. Fetch all product details needed for price_at_time in a single query
    // This is a safety check. For items with modifiers, we trust the calculated price from frontend
    const productIds = items.map(i => i.id);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, price, cost_price')
      .in('id', productIds);

    if (prodError) throw prodError;

    // 2. Process items one by one to handle modifiers
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;

      // Use the overridden price if provided (calculated in frontend for combos)
      const finalPrice = item.price_at_time !== undefined ? item.price_at_time : product.price;
      const finalCost = item.cost_at_time !== undefined ? item.cost_at_time : (product.cost_price || 0);

        const attendant_name = localStorage.getItem('pos_employee_name');

        const { data: insertedItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: finalPrice,
            cost_at_time: finalCost,
            attendant_name: attendant_name || 'Desconhecido'
          })
        .select()
        .single();

      if (itemError) throw itemError;

      // 3. Handle modifiers if any
      if (item.modifiers && item.modifiers.length > 0) {
        const modifierInserts = item.modifiers.map((m: any) => ({
          order_item_id: insertedItem.id,
          modifier_item_id: m.modifier_item_id,
          product_id: m.product_id,
          price_at_time: m.price_at_time,
          cost_at_time: m.cost_at_time || 0
        }));

        const { error: modError } = await supabase.from('order_item_modifiers').insert(modifierInserts);
        if (modError) throw modError;
      }
    }

    return { success: true };
  },
  removeOrderItem: async (orderId: number, itemId: number) => {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId).eq('order_id', orderId);
    if (error) throw error;
    return { success: true };
  },
  swapOrderItem: async (orderId: number, itemId: number, newProductId: number) => {
    const { data: product, error: prodError } = await supabase.from('products').select('*').eq('id', newProductId).single();
    if (prodError || !product) throw new Error('Product not found for swap');

    const { error: updateError } = await supabase.from('order_items').update({
       product_id: newProductId,
       price_at_time: product.price,
       cost_at_time: product.cost_price || 0
    }).eq('id', itemId).eq('order_id', orderId);
    
    if (updateError) throw updateError;
    return { success: true };
  },
  payOrder: async (orderId: number, amount: number, method: string) => {
    // Prevent double payments
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (order?.status === 'paid') return { success: true };

    const employee_id = localStorage.getItem('pos_employee_id');
    const { error: txError } = await supabase.from('transactions').insert({
      order_id: orderId,
      amount,
      method,
      employee_id: employee_id || null
    });
    if (txError) throw txError;

    const attendant_name = localStorage.getItem('pos_employee_name');
    const { error: updError } = await supabase.from('orders').update({
      status: 'paid',
      closed_at: new Date().toISOString(),
      receipt_printed: false,
      employee_id: employee_id || null,
      attendant_name: attendant_name || 'Desconhecido'
    }).eq('id', orderId);
    if (updError) throw updError;

    return { success: true };
  },

  paySplitOrder: async (orderId: number, entries: Array<{ amount: number; method: string }>) => {
    // Prevent double payments
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (order?.status === 'paid') return { success: true };

    const employee_id = localStorage.getItem('pos_employee_id');
    for (const entry of entries) {
      const { error } = await supabase.from('transactions').insert({
        order_id: orderId,
        amount: entry.amount,
        method: entry.method,
        employee_id: employee_id || null
      });
      if (error) throw error;
    }
    const attendant_name = localStorage.getItem('pos_employee_name');
    const { error: updError } = await supabase.from('orders').update({
      status: 'paid',
      closed_at: new Date().toISOString(),
      receipt_printed: false,
      employee_id: employee_id || null,
      attendant_name: attendant_name || 'Desconhecido'
    }).eq('id', orderId);
    if (updError) throw updError;
    return { success: true };
  },

  // Solicita ao servidor de impressão que imprima a conferência da comanda silenciosamente (sem diálogo)
  requestConferencePrint: async (orderIds: number[]) => {
    const { error } = await supabase
      .from('orders')
      .update({ conference_print_requested: true })
      .in('id', orderIds);
    if (error) throw error;
    return { success: true };
  },

  // Encerra uma comanda de valor zero sem pagamento (status: cancelled)
  closeZeroOrder: async (orderId: number) => {
    const { data: order } = await supabase.from('orders').select('status, id').eq('id', orderId).single();
    if (!order || order.status !== 'open') throw new Error('Comanda não encontrada ou já encerrada.');
    const { error } = await supabase.from('orders').update({
      status: 'cancelled',
      closed_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (error) throw error;
    return { success: true };
  },

  deleteTransaction: async (transactionId: number) => {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw error;
    return { success: true };
  },

  getEmployeeHistory: async (employeeId: string, startDate?: string, endDate?: string) => {
    let oq = supabase.from('orders').select('*, items:order_items(quantity, price_at_time, products(name))').eq('employee_id', employeeId).order('created_at', { ascending: false });
    if (startDate) oq = oq.gte('created_at', startDate);
    if (endDate) oq = oq.lte('created_at', endDate);
    
    let tq = supabase.from('transactions').select('*, order:orders(pulseira, customer_name)').eq('employee_id', employeeId).order('created_at', { ascending: false });
    if (startDate) tq = tq.gte('created_at', startDate);
    if (endDate) tq = tq.lte('created_at', endDate);

    const [ordersRes, transactionsRes] = await Promise.all([oq, tq]);
    if (ordersRes.error) throw ordersRes.error;
    if (transactionsRes.error) throw transactionsRes.error;

    return {
      orders: ordersRes.data || [],
      transactions: transactionsRes.data || []
    };
  },

  getGeneralHistory: async (startDate?: string, endDate?: string) => {
    // Orders — fetch all (frontend filters by closed_at/created_at per view). Exclude test orders.
    let oq = supabase.from('orders').select('*, waiter:employees(name), items:order_items(*, products(name))').order('created_at', { ascending: false }).not('id', 'in', '(6,7)');

    // Transactions
    let tq = supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (startDate) tq = tq.gte('created_at', startDate);
    if (endDate) tq = tq.lte('created_at', endDate);

    // Cashier sessions
    let cq = supabase.from('cashier_sessions').select('*').order('opened_at', { ascending: false });
    if (startDate) cq = cq.gte('opened_at', startDate);
    if (endDate) cq = cq.lte('opened_at', endDate);

    // Fixed pulseiras (employees + customers) — excluded from cashier stats
    const fq1 = supabase.from('employees').select('fixed_pulseira').not('fixed_pulseira', 'is', null);
    const fq2 = supabase.from('customers').select('fixed_pulseira').not('fixed_pulseira', 'is', null);

    const [ordersRes, transactionsRes, cashierRes, fixedEmpsRes, fixedCustsRes] = await Promise.all([oq, tq, cq, fq1, fq2]);
    if (ordersRes.error) throw ordersRes.error;
    if (transactionsRes.error) throw transactionsRes.error;
    if (cashierRes.error) throw cashierRes.error;

    const fixedPulseiras = new Set([
      ...(fixedEmpsRes.data || []).map((e: any) => e.fixed_pulseira),
      ...(fixedCustsRes.data || []).map((c: any) => c.fixed_pulseira),
    ]);

    return {
      orders: ordersRes.data || [],
      transactions: transactionsRes.data || [],
      cashier_sessions: cashierRes.data || [],
      fixedPulseiras: [...fixedPulseiras]
    };
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
    const cleanData = { ...employee };
    if (!cleanData.fixed_pulseira || cleanData.fixed_pulseira.trim() === '') {
      cleanData.fixed_pulseira = null;
    } else {
      cleanData.fixed_pulseira = cleanData.fixed_pulseira.replace(/\D/g, '').padStart(4, '0');
    }
    if (!cleanData.pin || (typeof cleanData.pin === 'string' && cleanData.pin.trim() === '')) {
      cleanData.pin = null;
    }

    if (employee.id) {
      const { error } = await supabase.from('employees').update(cleanData).eq('id', employee.id);
      if (error) {
         if (error.code === '23505') throw new Error('Pulseira Fixa já está em uso por outro funcionário.');
         throw error;
      }
    } else {
      const { id, ...newEmployee } = cleanData;
      const { error } = await supabase.from('employees').insert([newEmployee]);
      if (error) {
         if (error.code === '23505') throw new Error('Pulseira Fixa já está em uso.');
         throw error;
      }
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
        const totalNewStock = currentStock + addedStock;
        const totalNewBottles = Math.floor(totalNewStock);

        // Weighted average cost per bottle
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
  },

  // Product Batches (FIFO Management)
  getProductBatches: async (productId: number) => {
    const { data, error } = await supabase
      .from('product_batches')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  addBatch: async (batch: { product_id: number, quantity: number, unit_size: number, total_price: number, remaining_stock: number }) => {
    const { data, error } = await supabase.from('product_batches').insert(batch).select().single();
    if (error) throw error;
    return data;
  },
  deleteBatch: async (id: number) => {
    const { error } = await supabase.from('product_batches').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Merge: move all items from sourcePulseira into targetOrderId, then cancel source
  mergeOrder: async (sourcePulseira: string, targetOrderId: number) => {
    const { data: sourceOrder, error: srcError } = await supabase
      .from('orders')
      .select('id')
      .eq('pulseira', sourcePulseira)
      .eq('status', 'open')
      .maybeSingle();

    if (srcError) throw srcError;
    if (!sourceOrder) throw new Error('Comanda de origem não encontrada ou já fechada.');
    if (sourceOrder.id === targetOrderId) throw new Error('Não é possível importar a mesma comanda.');

    const { error: moveError } = await supabase
      .from('order_items')
      .update({ order_id: targetOrderId })
      .eq('order_id', sourceOrder.id);
    if (moveError) throw moveError;

    const { error: cancelError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', closed_at: new Date().toISOString() })
      .eq('id', sourceOrder.id);
    if (cancelError) throw cancelError;

    return { success: true };
  },

  // Transfer: move items from current order to a fixed customer's order (create dest if needed)
  transferOrder: async (sourceOrderId: number, destPulseira: string) => {
    const padded = destPulseira.replace(/\D/g, '').padStart(4, '0');

    // 1. Destination must belong to a fixed customer or employee
    const owner = await api.findFixedOwner(padded);
    if (!owner) throw new Error('Pulseira de destino não pertence a nenhum cliente ou funcionário fixo.');

    // 2. Find or create open order for destination pulseira
    let { data: destOrder } = await supabase
      .from('orders').select('id')
      .eq('pulseira', padded).eq('status', 'open').maybeSingle();

    if (!destOrder) {
      const employee_id = localStorage.getItem('pos_employee_id');
      const attendant_name = localStorage.getItem('pos_employee_name');
      const insertData: any = {
        pulseira: padded,
        customer_name: owner.name,
        employee_id: employee_id || null,
        attendant_name: attendant_name || 'Desconhecido'
      };
      if (owner.type === 'employee') {
        insertData.discount_percentage = (owner as any).discount_percentage;
        insertData.discount_cap = (owner as any).discount_cap;
      }
      const { data: newOrder, error: createError } = await supabase
        .from('orders').insert(insertData).select().single();
      if (createError) throw createError;
      destOrder = newOrder;
    }

    if (destOrder.id === sourceOrderId) throw new Error('Origem e destino são a mesma comanda.');

    // 3. Move all items
    const { error: moveError } = await supabase
      .from('order_items').update({ order_id: destOrder.id })
      .eq('order_id', sourceOrderId);
    if (moveError) throw moveError;

    // 4. Cancel source order
    const { error: cancelError } = await supabase
      .from('orders').update({ status: 'cancelled', closed_at: new Date().toISOString() })
      .eq('id', sourceOrderId);
    if (cancelError) throw cancelError;

    return { success: true, destPulseira: padded, destOrderId: destOrder.id };
  },

  // Corrige o número da pulseira diretamente na comanda aberta
  updateOrderPulseira: async (orderId: number, newPulseira: string) => {
    const padded = newPulseira.replace(/\D/g, '').padStart(4, '0');
    
    // Verifica se já existe uma comanda aberta com esse novo número
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('pulseira', padded)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) {
      throw new Error(`Já existe uma comanda aberta com o número #${padded}. Não é possível renomear para este número.`);
    }

    const { error } = await supabase
      .from('orders')
      .update({ pulseira: padded })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true, pulseira: padded };
  },

  // Conta comandas abertas no turno atual do caixa
  getCashierOrderCount: async () => {
    const { data: session } = await supabase
      .from('cashier_sessions')
      .select('opened_at')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return { activeSession: false, count: 0 };
    }

    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', session.opened_at)
      .neq('status', 'cancelled');

    if (error) throw error;
    return { activeSession: true, count: count || 0 };
  },

  // Quick stock correction from waiter screen
  quickUpdateStock: async (productId: number, newStock: number) => {
    const { data, error } = await supabase
      .rpc('quick_update_stock', { p_product_id: productId, p_new_stock: newStock });
    if (error) throw error;
    return data;
  },
};

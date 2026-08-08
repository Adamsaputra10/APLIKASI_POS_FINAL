import { createClient } from '@supabase/supabase-js';
import { Product, OnlineOrder, OnlineOrderItem, OnlineOrderStatus, ProductCategory, SaleTransaction } from '../types';

export const SUPABASE_URL = 'https://fkbftsgkegjzgzsjidnw.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_IvHpl_8SPOwinnH08gIesw_8bktQHKd';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Map raw row from Supabase 'products' table to App Product interface
 */
export function mapSupabaseProduct(row: any): Product {
  const catRaw = (row.category || 'ALL').toString().toUpperCase();
  const validCategory: ProductCategory = ['DRINKS', 'SNACKS', 'MERCH', 'FOOD'].includes(catRaw)
    ? (catRaw as ProductCategory)
    : 'ALL';

  return {
    id: String(row.id || row.product_id || ''),
    name: row.name || row.title || 'Produk',
    nameId: row.name_id || row.nameId || row.name,
    category: validCategory,
    price: Number(row.price || 0),
    stock: Number(row.stock !== undefined ? row.stock : (row.stock_quantity !== undefined ? row.stock_quantity : 0)),
    sku: row.sku || `SKU-${row.id}`,
    icon: row.icon || '📦',
    image: row.image || row.image_url || undefined,
    description: row.description || undefined,
    descriptionId: row.description_id || row.descriptionId || undefined,
  };
}

/**
 * Map raw row from Supabase 'orders' table to App OnlineOrder interface
 */
export function mapSupabaseOrder(
  row: any,
  extraOrderItems: any[] = [],
  productMap?: Map<string, Product>
): OnlineOrder {
  let rawItemsList: any[] = [];

  // 1. check if row.order_items is an array with items from join query
  if (Array.isArray(row.order_items) && row.order_items.length > 0) {
    rawItemsList = row.order_items;
  }
  // 2. check extraOrderItems passed from separate order_items query
  else if (Array.isArray(extraOrderItems) && extraOrderItems.length > 0) {
    rawItemsList = extraOrderItems;
  }
  // 3. check JSON column row.items
  else if (Array.isArray(row.items) && row.items.length > 0) {
    rawItemsList = row.items;
  } else if (typeof row.items === 'string') {
    try {
      const parsed = JSON.parse(row.items);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawItemsList = parsed;
      }
    } catch {}
  }

  let parsedItems: OnlineOrderItem[] = [];

  if (rawItemsList.length > 0) {
    parsedItems = rawItemsList.map((i: any) => {
      const pId = String(i.product_id || i.productId || i.id || '');
      
      // Determine exact original item name
      let name = i.product_name || i.name || i.title || i.item_name || i.product_title || '';

      // If name is missing or generic, try looking up in productMap
      if ((!name || name === 'Item' || name === 'Pesanan Web') && pId && productMap?.has(pId)) {
        const p = productMap.get(pId);
        if (p) name = p.name;
      }

      if (!name) {
        name = row.item_name || row.product_name || 'Barang Pesanan';
      }

      // Determine exact quantity
      let qty = 1;
      if (i.quantity !== undefined && i.quantity !== null) {
        qty = Number(i.quantity);
      } else if (i.qty !== undefined && i.qty !== null) {
        qty = Number(i.qty);
      } else if (i.amount !== undefined && i.amount !== null) {
        qty = Number(i.amount);
      }

      // Determine exact price
      let price = 0;
      if (i.price !== undefined && i.price !== null) {
        price = Number(i.price);
      } else if (i.unit_price !== undefined && i.unit_price !== null) {
        price = Number(i.unit_price);
      } else if (i.price_per_unit !== undefined && i.price_per_unit !== null) {
        price = Number(i.price_per_unit);
      }

      return {
        productId: pId,
        name: name,
        quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
        price: isNaN(price) ? 0 : price,
      };
    });
  }

  // Fallback ONLY if parsedItems is completely empty
  if (parsedItems.length === 0) {
    const itemName = row.item_name || row.product_name || row.title || 'Pesanan Web';
    const itemPrice = Number(row.total_payment || row.totalPayment || row.total_amount || row.price || 0);
    const itemQty = Number(row.quantity || row.qty || 1);
    parsedItems = [
      {
        productId: String(row.product_id || row.productId || 'item-web'),
        name: itemName,
        quantity: itemQty,
        price: itemQty > 0 ? Math.round(itemPrice / itemQty) : itemPrice,
      },
    ];
  }

  const rawStatus = (row.status || 'PENDING').toString().toUpperCase();
  const validStatus: OnlineOrderStatus = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(rawStatus)
    ? (rawStatus as OnlineOrderStatus)
    : 'PENDING';

  const courierName = row.courier || row.shipping_courier || row.expedition || row.courier_name || row.expedition_name || 'Ekspedisi Standard';
  const shippingFeeVal = Number(row.shipping_fee || row.shipping_cost || row.shipping || row.ongkir || 0);
  const trackingNo = row.tracking_number || row.resi || row.receipt_number || row.no_resi || row.trackingNumber || undefined;
  const notesVal = row.notes || row.catatan || row.note || undefined;

  return {
    id: String(row.id),
    orderNumber: row.order_number || row.orderNumber || `WEB-${row.id}`,
    customerName: row.customer_name || row.customerName || row.name || 'Pelanggan Web',
    customerPhone: row.customer_phone || row.customerPhone || row.phone || '-',
    customerAddress: row.customer_address || row.customerAddress || row.address || '-',
    items: parsedItems,
    totalPayment: Number(row.total_payment || row.totalPayment || row.total_amount || row.total || 0),
    timestamp: row.timestamp || (row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19)),
    status: validStatus,
    paymentMethod: row.payment_method || row.paymentMethod || 'QRIS Web Checkout',
    courier: courierName,
    shippingFee: shippingFeeVal,
    trackingNumber: trackingNo,
    notes: notesVal,
  };
}

/**
 * Fetch orders and order_items directly from Supabase with full item detail resolution
 */
export async function fetchSupabaseOrdersWithItems(productsList: Product[] = []): Promise<OnlineOrder[]> {
  // 1. Try querying orders with order_items join first
  let ordersData: any[] = [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      ordersData = data;
    }
  } catch (e) {
    console.error('Joined orders query error:', e);
  }

  // 2. Fallback if joined query failed or returned empty
  let rawOrders: any[] = [];
  if (ordersData.length === 0) {
    try {
      const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
      if (data) rawOrders = data;
    } catch (e) {
      console.error('Raw orders query error:', e);
    }
  } else {
    rawOrders = ordersData;
  }

  // 3. Fetch all items from order_items table
  let rawOrderItems: any[] = [];
  try {
    const { data } = await supabase.from('order_items').select('*');
    if (data) rawOrderItems = data;
  } catch (e) {
    // order_items table might not exist or might be empty
  }

  // Build product map for name resolution
  const productMap = new Map<string, Product>();
  productsList.forEach((p) => {
    productMap.set(String(p.id), p);
    if (p.sku) productMap.set(String(p.sku), p);
  });

  return rawOrders.map((orderRow) => {
    // Find items for this order from rawOrderItems
    const matchedItems = rawOrderItems.filter(
      (item) =>
        String(item.order_id) === String(orderRow.id) ||
        String(item.order_number) === String(orderRow.order_number) ||
        String(item.order_id) === String(orderRow.order_number)
    );

    return mapSupabaseOrder(orderRow, matchedItems, productMap);
  });
}

/**
 * Fetch a single order with its items for Realtime INSERT updates
 */
export async function fetchSingleOrderWithItems(
  orderRow: any,
  productsList: Product[] = []
): Promise<OnlineOrder> {
  const productMap = new Map<string, Product>();
  productsList.forEach((p) => {
    productMap.set(String(p.id), p);
    if (p.sku) productMap.set(String(p.sku), p);
  });

  // If order_items already joined
  if (Array.isArray(orderRow.order_items) && orderRow.order_items.length > 0) {
    return mapSupabaseOrder(orderRow, [], productMap);
  }

  // Query order_items table directly for this order
  const filters: string[] = [];
  if (orderRow.id !== undefined && orderRow.id !== null) {
    filters.push(`order_id.eq.${orderRow.id}`);
  }
  if (orderRow.order_number) {
    filters.push(`order_number.eq.${orderRow.order_number}`);
  }

  if (filters.length > 0) {
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .or(filters.join(','));

      if (data && data.length > 0) {
        return mapSupabaseOrder(orderRow, data, productMap);
      }
    } catch (e) {
      console.error('Error fetching single order_items:', e);
    }
  }

  return mapSupabaseOrder(orderRow, [], productMap);
}

/**
 * Map raw row from Supabase 'pos_transactions' or 'transactions' table to App SaleTransaction interface
 */
export function mapSupabaseTransactionRow(row: any): SaleTransaction {
  let parsedItems: any[] = [];
  if (Array.isArray(row.items)) {
    parsedItems = row.items;
  } else if (typeof row.items === 'string') {
    try {
      parsedItems = JSON.parse(row.items);
    } catch {}
  }

  return {
    id: String(row.id),
    orderNumber: row.order_number || row.orderNumber || `POS-${row.id}`,
    timestamp: row.timestamp || (row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19)),
    channel: row.channel || 'CASH',
    type: row.type || (row.channel === 'ONLINE_WEB' ? 'ONLINE_WEB' : 'OFFLINE_STORE'),
    items: Array.isArray(parsedItems) ? parsedItems.map((i: any) => ({
      id: String(i.id || i.productId || ''),
      name: i.name || i.product_name || 'Barang',
      quantity: Number(i.quantity || i.qty || 1),
      price: Number(i.price || 0),
    })) : [],
    subtotal: Number(row.subtotal || row.total || 0),
    discount: Number(row.discount || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    tendered: Number(row.tendered || row.total || 0),
    change: Number(row.change || 0),
    cashierName: row.cashier_name || row.cashierName || 'Kasir POS',
  };
}

/**
 * Fetch offline transactions and combine with completed web orders from Supabase
 */
export async function fetchSupabaseTransactions(completedOrders: OnlineOrder[] = []): Promise<SaleTransaction[]> {
  let offlineTxs: SaleTransaction[] = [];
  try {
    const { data } = await supabase.from('pos_transactions').select('*').order('id', { ascending: false });
    if (data && data.length > 0) {
      offlineTxs = data.map(mapSupabaseTransactionRow);
    }
  } catch (e) {}

  if (offlineTxs.length === 0) {
    try {
      const { data } = await supabase.from('transactions').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        offlineTxs = data.map(mapSupabaseTransactionRow);
      }
    } catch (e) {}
  }

  // Convert completed web orders into SaleTransaction objects for unified LAPORAN & PENJUALAN
  const webTxs: SaleTransaction[] = completedOrders
    .filter((o) => o.status === 'COMPLETED')
    .map((o) => ({
      id: `tx-web-${o.id || o.orderNumber}`,
      orderNumber: o.orderNumber,
      timestamp: o.timestamp,
      channel: 'ONLINE_WEB',
      type: 'ONLINE_WEB',
      items: o.items.map((i, idx) => ({
        id: i.productId || `item-${idx}`,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: o.totalPayment,
      discount: 0,
      tax: 0,
      total: o.totalPayment,
      tendered: o.totalPayment,
      change: 0,
      cashierName: `Web Order (${o.customerName})`,
    }));

  // Combine both offline POS transactions and completed web orders, avoiding duplicates
  const txMap = new Map<string, SaleTransaction>();
  offlineTxs.forEach((t) => txMap.set(t.id, t));
  webTxs.forEach((t) => {
    if (!txMap.has(t.id)) {
      txMap.set(t.id, t);
    }
  });

  return Array.from(txMap.values());
}


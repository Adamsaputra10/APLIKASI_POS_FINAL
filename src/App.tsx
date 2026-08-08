import { useState, useEffect, useRef } from 'react';
import {
  ActiveTab,
  Language,
  OnlineOrder,
  OnlineOrderStatus,
  Product,
  SaleTransaction,
  ShiftState,
  StaffUser,
} from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_ONLINE_ORDERS, DEMO_STAFF } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginShiftModal } from './components/LoginShiftModal';
import { CloseShiftModal } from './components/CloseShiftModal';
import { POSScreen } from './components/POSScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { OnlineOrdersScreen } from './components/OnlineOrdersScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { PinLockScreen } from './components/PinLockScreen';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { playCashRegisterSound, play8BitOrderBellSound } from './utils/audio';
import {
  supabase,
  mapSupabaseProduct,
  mapSupabaseOrder,
  fetchSupabaseOrdersWithItems,
  fetchSingleOrderWithItems,
  fetchSupabaseTransactions,
} from './lib/supabase';

export default function App() {
  // State Initialization with localStorage
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('retroshop_lang') as Language) || 'EN';
  });

  const [showScanlines, setShowScanlines] = useState<boolean>(() => {
    return localStorage.getItem('retroshop_scanlines') !== 'false';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('retroshop_theme') as 'dark' | 'light') || 'dark';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('POS');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('retroshop_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (p: any) =>
              !String(p.id).startsWith('prod-') &&
              !String(p.sku).startsWith('RET-')
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('retroshop_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any old mock data entries
          return parsed.filter(
            (t: any) =>
              !String(t.id).startsWith('tx-100') &&
              !String(t.orderNumber).startsWith('ORD-902') &&
              !String(t.orderNumber).startsWith('POS-004')
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>(() => {
    const saved = localStorage.getItem('retroshop_online_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any old mock web order entries
          return parsed.filter(
            (o: any) =>
              !String(o.id).startsWith('web-ord-10') &&
              !String(o.orderNumber).startsWith('WEB-990')
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [shiftState, setShiftState] = useState<ShiftState>(() => {
    const session = localStorage.getItem('pos_active_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.isLoggedIn && parsed.shiftState && parsed.shiftState.isOpen) {
          return parsed.shiftState;
        }
      } catch (e) {
        console.error('Error reading pos_active_session for shiftState:', e);
      }
    }
    const saved = localStorage.getItem('retroshop_shift');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isOpen) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {
      isOpen: true,
      staffUser: DEMO_STAFF[0],
      openedAt: new Date().toISOString(),
      startingCash: 100.0,
    };
  });

  // Security & Toast Notification States
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    const session = localStorage.getItem('pos_active_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.isLoggedIn === true) {
          return false; // Active persistent session exists - do NOT lock PIN screen on page refresh!
        }
      } catch (e) {
        console.error('Error checking persistent login session:', e);
      }
    }
    return true; // First time or logged out: lock terminal with PIN screen
  });
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Modal Visibility States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<SaleTransaction | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('retroshop_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('retroshop_scanlines', String(showScanlines));
  }, [showScanlines]);

  useEffect(() => {
    localStorage.setItem('retroshop_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('retroshop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('retroshop_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('retroshop_online_orders', JSON.stringify(onlineOrders));
  }, [onlineOrders]);

  useEffect(() => {
    localStorage.setItem('retroshop_shift', JSON.stringify(shiftState));
    if (shiftState.isOpen && shiftState.staffUser) {
      localStorage.setItem(
        'pos_active_session',
        JSON.stringify({
          isLoggedIn: true,
          staffUser: shiftState.staffUser,
          shiftState,
          loggedInAt: new Date().toISOString(),
        })
      );
    }
  }, [shiftState]);

  // Supabase Database Fetch & Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseData() {
      let currentProducts: Product[] = productsRef.current;

      // 1. Fetch catalog & stock directly from Supabase 'products' table
      try {
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
        if (!prodErr && prodData && isMounted) {
          currentProducts = prodData.map(mapSupabaseProduct);
          setProducts(currentProducts);
        }
      } catch (err) {
        console.error('Error fetching Supabase products:', err);
      }

      // 2. Fetch web orders and order_items directly from Supabase
      try {
        const mappedOrders = await fetchSupabaseOrdersWithItems(currentProducts);
        if (isMounted) {
          setOnlineOrders(mappedOrders || []);
        }

        // 3. Fetch sales transactions directly from Supabase
        const mappedTransactions = await fetchSupabaseTransactions(mappedOrders || []);
        if (isMounted) {
          setTransactions(mappedTransactions || []);
        }
      } catch (err) {
        console.error('Error fetching Supabase orders and transactions:', err);
      }
    }

    loadSupabaseData();

    // 3. Supabase Realtime Listener on 'orders', 'order_items', and 'products' tables
    const ordersChannel = supabase
      .channel('realtime-pos-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (!isMounted) return;
          console.log('Supabase Realtime Event on orders:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            // Play 8-bit bell audio sound on new web order
            play8BitOrderBellSound();
            const newOrder = await fetchSingleOrderWithItems(payload.new, productsRef.current);
            setOnlineOrders((prev) => {
              const existingIdx = prev.findIndex(
                (o) =>
                  String(o.id) === String(newOrder.id) ||
                  o.orderNumber === newOrder.orderNumber ||
                  String(o.id) === String(newOrder.orderNumber)
              );
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], ...newOrder };
                return updated;
              }
              return [newOrder, ...prev];
            });

            // Re-sync products stock levels from Supabase to keep POS stock view fresh
            try {
              const { data: latestProds } = await supabase.from('products').select('*');
              if (latestProds && isMounted) {
                setProducts(latestProds.map(mapSupabaseProduct));
              }
            } catch (e) {
              console.error('Error refreshing product stock on new order:', e);
            }

            showToast(
              'info',
              `🔔 PESANAN ONLINE BARU: ${newOrder.orderNumber} (${newOrder.customerName})`
            );
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = await fetchSingleOrderWithItems(payload.new, productsRef.current);
            setOnlineOrders((prev) =>
              prev.map((o) => {
                if (
                  String(o.id) === String(updatedOrder.id) ||
                  o.orderNumber === updatedOrder.orderNumber ||
                  String(o.id) === String(updatedOrder.orderNumber)
                ) {
                  return { ...o, ...updatedOrder };
                }
                return o;
              })
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        async (payload) => {
          if (!isMounted) return;
          console.log('Supabase Realtime Event on order_items:', payload);
          // Refresh orders list to reflect newly inserted/updated order items
          const refreshedOrders = await fetchSupabaseOrdersWithItems(productsRef.current);
          if (refreshedOrders && refreshedOrders.length > 0) {
            setOnlineOrders(refreshedOrders);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!isMounted) return;
          console.log('Supabase Realtime Event on products:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedProd = mapSupabaseProduct(payload.new);
            setProducts((prev) => {
              const idx = prev.findIndex((p) => p.id === updatedProd.id);
              if (idx >= 0) {
                const nextArr = [...prev];
                nextArr[idx] = { ...nextArr[idx], ...updatedProd };
                return nextArr;
              }
              return [updatedProd, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setProducts((prev) => prev.filter((p) => p.id !== String(payload.old.id)));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // Handlers
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  const handleToggleScanlines = () => {
    setShowScanlines((prev) => !prev);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenShift = (staffUser: StaffUser, startingCash: number) => {
    const newShift: ShiftState = {
      isOpen: true,
      staffUser,
      openedAt: new Date().toISOString(),
      startingCash,
    };
    setShiftState(newShift);
    setIsPinLocked(false);
    localStorage.setItem(
      'pos_active_session',
      JSON.stringify({
        isLoggedIn: true,
        staffUser,
        shiftState: newShift,
        loggedInAt: new Date().toISOString(),
      })
    );
    setIsLoginModalOpen(false);
    showToast('success', language === 'ID' ? `Shift Baru Dibuka oleh ${staffUser.name}` : `Shift opened by ${staffUser.name}`);
  };

  const handleConfirmCloseShift = () => {
    setShiftState({
      isOpen: false,
      staffUser: null,
      openedAt: null,
      startingCash: 0,
    });
    localStorage.removeItem('pos_active_session');
    localStorage.removeItem('retroshop_shift');
    setIsCloseShiftModalOpen(false);
    setIsPinLocked(true);
    showToast(
      'info',
      language === 'ID'
        ? 'Shift Resmi Ditutup. Sesi Berakhir. Kembali ke Layar PIN.'
        : 'Shift Officially Closed. Session Ended. Back to PIN Screen.'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_active_session');
    setIsPinLocked(true);
    showToast(
      'info',
      language === 'ID' ? 'Kasir Berhasil Logout' : 'Cashier Logged Out'
    );
  };

  const handleProcessSale = async (newTx: SaleTransaction) => {
    // 1. Add transaction to history
    setTransactions((prev) => [newTx, ...prev]);

    // Save transaction to Supabase
    try {
      const payload = {
        id: newTx.id,
        order_number: newTx.orderNumber,
        timestamp: newTx.timestamp,
        channel: newTx.channel,
        type: newTx.type,
        items: JSON.stringify(newTx.items),
        subtotal: newTx.subtotal,
        discount: newTx.discount,
        tax: newTx.tax,
        total: newTx.total,
        tendered: newTx.tendered,
        change: newTx.change,
        cashier_name: newTx.cashierName,
      };

      const { error } = await supabase.from('pos_transactions').insert(payload);
      if (error) {
        await supabase.from('transactions').insert(payload);
      }
    } catch (err) {
      console.error('Error saving transaction to Supabase:', err);
    }

    // 2. Decrement product stock levels locally and in Supabase
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemSold = newTx.items.find((i) => i.id === p.id);
        if (itemSold) {
          const newStock = Math.max(0, p.stock - itemSold.quantity);
          supabase.from('products').update({ stock: newStock }).eq('id', p.id).then();
          return {
            ...p,
            stock: newStock,
          };
        }
        return p;
      })
    );
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OnlineOrderStatus) => {
    const targetOrder = onlineOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    let generatedResi: string | undefined = undefined;

    if (targetOrder) {
      // If moving to SHIPPED, generate tracking number if missing
      if (newStatus === 'SHIPPED') {
        generatedResi = targetOrder.trackingNumber || `RES-${Math.floor(10000000 + Math.random() * 90000000)}`;
      }

      // If completing order, record to transactions if not present
      if (newStatus === 'COMPLETED' && targetOrder.status !== 'COMPLETED') {
        const txId = `tx-web-${targetOrder.id || targetOrder.orderNumber}`;
        setTransactions((prevTx) => {
          if (prevTx.some((t) => t.id === txId || t.orderNumber === targetOrder.orderNumber)) {
            return prevTx;
          }
          const newTx: SaleTransaction = {
            id: txId,
            orderNumber: targetOrder.orderNumber,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            channel: 'ONLINE_WEB',
            type: 'ONLINE_WEB',
            items: targetOrder.items.map((item, idx) => ({
              id: item.productId || `item-${idx}`,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: targetOrder.totalPayment,
            discount: 0,
            tax: 0,
            total: targetOrder.totalPayment,
            tendered: targetOrder.totalPayment,
            change: 0,
            cashierName: `Web Order (${targetOrder.customerName})`,
          };
          return [newTx, ...prevTx];
        });
      }
    }

    // Update local React state for onlineOrders
    setOnlineOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          return {
            ...o,
            status: newStatus,
            trackingNumber: generatedResi || o.trackingNumber,
          };
        }
        return o;
      })
    );

    // 2. Update order status & tracking_number in Supabase database
    try {
      const updatePayload: any = { status: newStatus };
      if (generatedResi) {
        updatePayload.tracking_number = generatedResi;
        updatePayload.resi = generatedResi;
        updatePayload.no_resi = generatedResi;
      }

      await supabase.from('orders').update(updatePayload).eq('id', orderId);
      await supabase.from('orders').update(updatePayload).eq('order_number', orderId);
    } catch (err) {
      console.error('Error updating order status in Supabase:', err);
    }
  };

  const handleSimulateNewOrder = async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sampleCustomers = [
      { name: 'Andi Wijaya', phone: '0812-9988-1122', address: 'Jl. Malioboro No. 15, Yogyakarta' },
      { name: 'Nadia Putri', phone: '0856-4433-2211', address: 'Jl. Thamrin No. 80, Jakarta Pusat' },
      { name: 'Fajar Pratama', phone: '0818-7766-5544', address: 'Jl. Asia Afrika No. 20, Bandung' },
    ];
    const cust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const sampleProduct = products[Math.floor(Math.random() * products.length)] || products[0];
    const qty = Math.floor(1 + Math.random() * 2);
    const orderNum = `WEB-${randomNum}`;

    const orderItems = [
      {
        productId: sampleProduct?.id || 'prod-1',
        name: language === 'ID' && sampleProduct?.nameId ? sampleProduct.nameId : (sampleProduct?.name || 'Produk Retro'),
        quantity: qty,
        price: sampleProduct?.price || 25000,
      },
    ];
    const totalPay = (sampleProduct?.price || 25000) * qty;

    const newOrderPayload = {
      order_number: orderNum,
      customer_name: cust.name,
      customer_phone: cust.phone,
      customer_address: cust.address,
      items: orderItems,
      total_payment: totalPay,
      status: 'PENDING',
      payment_method: 'QRIS Web Checkout',
    };

    try {
      const { data, error } = await supabase.from('orders').insert([newOrderPayload]).select();
      if (!error && data && data.length > 0) {
        // Realtime listener will catch the INSERT, play 8-bit bell chime, and append to state
        return;
      }
    } catch (e) {
      console.error('Error inserting order to Supabase:', e);
    }

    // Direct fallback if Realtime isn't immediate
    play8BitOrderBellSound();
    const fallbackOrder: OnlineOrder = {
      id: `web-ord-${Date.now()}`,
      orderNumber: orderNum,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      items: orderItems,
      totalPayment: totalPay,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'PENDING',
      paymentMethod: 'QRIS Web Checkout',
    };
    setOnlineOrders((prev) => [fallbackOrder, ...prev]);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (productData.id) {
      // Edit existing product permanently in Supabase
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productData.id ? ({ ...p, ...productData } as Product) : p
        )
      );
      const updatePayload: any = {
        name: productData.name,
        name_id: productData.nameId,
        category: productData.category,
        price: Number(productData.price),
        stock: Number(productData.stock),
        sku: productData.sku,
        icon: productData.icon,
        image: productData.image || null,
        description: productData.description || null,
        description_id: productData.descriptionId || null,
      };
      try {
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productData.id);

        if (error) throw error;
        showToast('success', 'Produk Berhasil Diperbarui!');
      } catch (err: any) {
        console.error('Error updating product in Supabase:', err);
        showToast('error', `Gagal memperbarui produk: ${err?.message || 'Error Supabase'}`);
      }
    } else {
      // Create new product permanently in Supabase
      const newProdId = `prod-${Date.now()}`;
      const newProd: Product = {
        ...productData,
        id: newProdId,
      } as Product;
      setProducts((prev) => [newProd, ...prev]);

      const insertPayload: any = {
        id: newProd.id,
        name: newProd.name,
        name_id: newProd.nameId,
        category: newProd.category,
        price: Number(newProd.price),
        stock: Number(newProd.stock),
        sku: newProd.sku,
        icon: newProd.icon,
        image: newProd.image || null,
        description: newProd.description || null,
        description_id: newProd.descriptionId || null,
      };

      try {
        const { error } = await supabase.from('products').insert([insertPayload]);
        if (error) throw error;
        showToast('success', 'Produk Berhasil Ditambahkan!');
      } catch (err: any) {
        console.error('Error adding product to Supabase:', err);
        showToast('error', `Gagal menambahkan produk: ${err?.message || 'Error Supabase'}`);
      }
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: updated.stock,
          price: updated.price,
          name: updated.name,
          name_id: updated.nameId,
          image: updated.image || null,
        })
        .eq('id', updated.id);

      if (error) throw error;
      showToast('success', 'Stok & Data Produk Disimpan ke Supabase');
    } catch (err: any) {
      console.error('Error updating product stock:', err);
      showToast('error', `Gagal memperbarui stok: ${err?.message || 'Error'}`);
    }
  };

  const handleUnlockPin = (staff: StaffUser) => {
    setIsPinLocked(false);
    const activeShift: ShiftState = {
      isOpen: true,
      staffUser: staff,
      openedAt: shiftState.openedAt || new Date().toISOString(),
      startingCash: shiftState.startingCash || 100.0,
    };
    setShiftState(activeShift);
    localStorage.setItem(
      'pos_active_session',
      JSON.stringify({
        isLoggedIn: true,
        staffUser: staff,
        shiftState: activeShift,
        loggedInAt: new Date().toISOString(),
      })
    );
    showToast('success', `Akses Diberikan: Selamat Datang ${staff.name}`);
  };

  const lowStockCount = products.filter((p) => p.stock <= 8).length;
  const pendingOrdersCount = onlineOrders.filter((o) => o.status === 'PENDING').length;

  return (
    <div
      data-theme={theme}
      className={`h-screen h-[100dvh] w-full overflow-hidden flex flex-col bg-[#121324] text-[#e0e6f8] transition-colors duration-200 relative ${
        showScanlines ? 'scanlines' : ''
      }`}
    >
      {/* Top Fixed Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        shiftState={shiftState}
        onOpenShiftModal={() => {
          if (!shiftState.isOpen) {
            setIsPinLocked(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
        showScanlines={showScanlines}
        onToggleScanlines={handleToggleScanlines}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main App Central Workspace Stage Container */}
      <main className="flex-1 min-h-0 overflow-hidden w-full flex flex-col pb-[60px] md:pb-[64px]">
        {/* Active Screen Tab View */}
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
          {activeTab === 'POS' && (
            <POSScreen
              products={products}
              language={language}
              shiftState={shiftState}
              onProcessSale={handleProcessSale}
              onOpenReceiptModal={(tx) => setReceiptTransaction(tx)}
            />
          )}

          {activeTab === 'INVENTORY' && (
            <InventoryScreen
              products={products}
              language={language}
              currentRole={shiftState.staffUser?.role || 'CASHIER'}
              onUpdateProduct={handleUpdateProduct}
              onOpenAddProductModal={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditProductModal={(p) => {
                setEditingProduct(p);
                setIsProductModalOpen(true);
              }}
            />
          )}

          {activeTab === 'ONLINE_ORDERS' && (
            <OnlineOrdersScreen
              language={language}
              orders={onlineOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSimulateNewOrder={handleSimulateNewOrder}
            />
          )}

          {activeTab === 'REPORTS' && (
            <DashboardScreen
              transactions={transactions}
              language={language}
              shiftState={shiftState}
              onOpenReceiptModal={(tx) => setReceiptTransaction(tx)}
            />
          )}
        </div>
      </main>

      {/* Bottom Fixed Universal Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
        currentRole={shiftState.staffUser?.role || 'CASHIER'}
        lowStockCount={lowStockCount}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Modals */}
      <LoginShiftModal
        isOpen={isLoginModalOpen}
        language={language}
        onOpenShift={handleOpenShift}
        onCloseModal={() => setIsLoginModalOpen(false)}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        language={language}
        shiftState={shiftState}
        transactions={transactions}
        onConfirmCloseShift={handleConfirmCloseShift}
        onCancel={() => setIsCloseShiftModalOpen(false)}
      />

      <ReceiptModal
        isOpen={Boolean(receiptTransaction)}
        transaction={receiptTransaction}
        language={language}
        onClose={() => setReceiptTransaction(null)}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        language={language}
        onSaveProduct={handleSaveProduct}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        existingProduct={editingProduct}
      />

      <PinLockScreen
        isOpen={isPinLocked}
        language={language}
        onUnlock={handleUnlockPin}
      />

      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}


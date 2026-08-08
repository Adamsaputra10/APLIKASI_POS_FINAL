import React, { useState } from 'react';
import {
  CartItem,
  Language,
  PaymentChannel,
  Product,
  ProductCategory,
  SaleTransaction,
  ShiftState,
} from '../types';
import { getText } from '../utils/i18n';
import {
  playCashRegisterSound,
  playErrorSound,
  playKeyBeep,
} from '../utils/audio';
import { formatPrice } from '../utils/currency';

interface POSScreenProps {
  products: Product[];
  language: Language;
  shiftState: ShiftState;
  onProcessSale: (transaction: SaleTransaction) => void;
  onOpenReceiptModal: (transaction: SaleTransaction) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  language,
  shiftState,
  onProcessSale,
  onOpenReceiptModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(5); // Default 5% flexible tax rate
  const [isCustomTaxModalOpen, setIsCustomTaxModalOpen] = useState<boolean>(false);
  const [customTaxInput, setCustomTaxInput] = useState<string>('5');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Categories list
  const categories: ProductCategory[] = ['ALL', 'DRINKS', 'SNACKS', 'FOOD', 'MERCH'];

  // Filter products by category and search query
  const filteredProducts = products.filter((prod) => {
    const matchesCat =
      selectedCategory === 'ALL' || prod.category === selectedCategory;
    const name = language === 'ID' && prod.nameId ? prod.nameId : prod.name;
    const matchesQuery =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      playErrorSound();
      setErrorMessage(getText(language, 'outOfStock'));
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    playKeyBeep();
    setErrorMessage('');

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          playErrorSound();
          setErrorMessage(getText(language, 'outOfStock'));
          setTimeout(() => setErrorMessage(''), 2500);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                itemSubtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          itemSubtotal: product.price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    playKeyBeep();
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              playErrorSound();
              setErrorMessage(getText(language, 'outOfStock'));
              setTimeout(() => setErrorMessage(''), 2500);
              return item;
            }
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemSubtotal: newQty * item.product.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    playKeyBeep();
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    playKeyBeep();
    setCart([]);
    setTenderedAmount('');
    setErrorMessage('');
  };

  // Calculations
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = cart.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const taxableSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = (taxableSubtotal * taxPercent) / 100; // Flexible tax calculation
  const grandTotal = taxableSubtotal + taxAmount;

  const rawTendered = parseFloat(tenderedAmount) || 0;
  const tenderedInUSD = rawTendered;
  const changeDueUSD = Math.max(0, rawTendered - grandTotal);

  // Keypad Handlers
  const handleKeypadPress = (val: string) => {
    playKeyBeep();
    if (val === 'CLR') {
      setTenderedAmount('');
    } else if (val === 'BACK') {
      setTenderedAmount((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (!tenderedAmount.includes('.')) {
        setTenderedAmount((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else if (val === '00' || val === '000') {
      if (tenderedAmount === '' || tenderedAmount === '0') {
        setTenderedAmount('0');
      } else {
        setTenderedAmount((prev) => prev + val);
      }
    } else {
      setTenderedAmount((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const setExactTender = (exactAmount: number) => {
    playKeyBeep();
    setTenderedAmount(Math.round(exactAmount).toString());
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      playErrorSound();
      setErrorMessage(getText(language, 'noItemsInCart'));
      return;
    }

    if (paymentChannel === 'CASH' && tenderedInUSD < grandTotal - 0.001) {
      playErrorSound();
      setErrorMessage(getText(language, 'insufficientTender'));
      return;
    }

    const orderNum = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const transaction: SaleTransaction = {
      id: `tx-${Date.now()}`,
      orderNumber: orderNum,
      timestamp,
      channel: paymentChannel,
      type: 'OFFLINE_STORE',
      items: cart.map((item) => ({
        id: item.product.id,
        name:
          language === 'ID' && item.product.nameId
            ? item.product.nameId
            : item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: rawSubtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      tendered: paymentChannel === 'CASH' ? tenderedInUSD : grandTotal,
      change: paymentChannel === 'CASH' ? changeDueUSD : 0,
      cashierName: shiftState.staffUser?.name || 'Alex (Cashier)',
    };

    playCashRegisterSound();
    onProcessSale(transaction);
    onOpenReceiptModal(transaction);

    // Reset checkout state
    setCart([]);
    setTenderedAmount('');
    setDiscountPercent(0);
    setErrorMessage('');
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="grid grid-cols-12 gap-2 md:gap-4 w-full h-full min-h-0 overflow-hidden p-2 md:p-4">
      {/* Left 7 Columns: Product Catalog Grid */}
      <section className="col-span-7 xl:col-span-8 flex flex-col retro-box h-full min-h-0 overflow-hidden">
        {/* Retro Header */}
        <div className="retro-window-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>🕹️</span>
            <span>{getText(language, 'catalog')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block bg-[#0d0e1c] text-[#55ffd6] text-[10px] px-2 py-0.5 border border-[#00a88f] font-mono font-bold">
              ⚡ STOK TERSINKRONIZASI WEB ILYASVIELSHOP
            </span>
            <div className="text-xs text-[#121324] font-bold">
              {filteredProducts.length} ITEMS
            </div>
          </div>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="bg-[#0d0e1c] p-2 border-b-2 border-[#00a88f] space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playKeyBeep();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1 text-xs vt323-font font-bold uppercase transition-all whitespace-nowrap border-2 ${
                  selectedCategory === cat
                    ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                    : 'bg-[#1a1c36] text-[#00a88f] border-gray-700 hover:border-[#00a88f]'
                }`}
              >
                [{getText(language, cat.toLowerCase())}]
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#ff7700] font-bold">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getText(language, 'searchPlaceholder')}
              className="retro-input w-full pl-9 py-1 text-xs font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#ff7700] font-bold hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto bg-[#121324] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {filteredProducts.map((prod) => {
            const displayName =
              language === 'ID' && prod.nameId ? prod.nameId : prod.name;
            const isLowStock = prod.stock <= 5;
            const isOut = prod.stock <= 0;

            return (
              <div
                key={prod.id}
                className={`retro-box flex flex-col items-center justify-between p-2.5 relative group transition-all text-left ${
                  isOut
                    ? 'opacity-40 grayscale cursor-not-allowed border-gray-600'
                    : 'hover:border-[#ff7700] hover:scale-[1.01]'
                }`}
              >
                {/* Detail Info Trigger Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playKeyBeep();
                    setDetailProduct(prod);
                  }}
                  title={language === 'ID' ? 'Lihat Foto & Deskripsi Detail' : 'View Photo & Detailed Description'}
                  className="absolute top-1.5 left-1.5 z-10 bg-[#0d0e1c] hover:bg-[#ff7700] text-[#ff7700] hover:text-[#121324] border border-[#00a88f] px-1.5 py-0.5 text-[10px] font-bold"
                >
                  👁️ INFO
                </button>

                {/* Stock Tag */}
                <span
                  className={`absolute top-1.5 right-1.5 z-10 text-[10px] font-bold px-1.5 py-0.5 border ${
                    isOut
                      ? 'bg-red-900 text-white border-red-500'
                      : isLowStock
                      ? 'bg-[#ff7700] text-[#121324] border-black animate-pulse'
                      : 'bg-[#00a88f] text-[#121324] border-black'
                  }`}
                >
                  {isOut ? 'OOS' : `STK: ${prod.stock}`}
                </span>

                {/* Main Card Content (Click to Add to Cart) */}
                <button
                  onClick={() => addToCart(prod)}
                  disabled={isOut}
                  className="w-full flex flex-col items-center pt-5 pb-1 flex-1"
                >
                  {/* Product Photo or Pixel Icon */}
                  <div className="w-full h-20 sm:h-24 mb-2 bg-[#0d0e1c] border border-[#00a88f] flex items-center justify-center overflow-hidden relative group-hover:border-[#ff7700]">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl transform group-hover:scale-110 transition-transform">
                        {prod.icon || '🛍️'}
                      </span>
                    )}
                  </div>

                  {/* SKU */}
                  <span className="text-[9px] text-gray-400 font-mono self-start">
                    #{prod.sku}
                  </span>

                  {/* Name */}
                  <div className="vt323-font text-base sm:text-lg font-bold text-[#e0e6f8] text-center leading-tight line-clamp-2 my-1">
                    {displayName}
                  </div>

                  {/* Price Badge */}
                  <div className="mt-auto w-full bg-[#0d0e1c] border border-[#00a88f] py-0.5 px-2 text-center text-[#ff7700] font-bold text-xs sm:text-sm vt323-font group-hover:border-[#ff7700]">
                    {formatPrice(prod.price, language)}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Right 5 Columns: Receipt & Checkout Keypad */}
      <section className="col-span-5 xl:col-span-4 flex flex-col retro-box h-full min-h-0 overflow-y-auto">
        {/* Retro Header */}
        <div className="retro-window-header-orange">
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span>{getText(language, 'activeReceipt')}</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="bg-[#121324] text-[#ff8888] px-2 py-0.5 border border-black font-bold text-xs hover:bg-red-900"
            >
              🗑️ {getText(language, 'clear')}
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-[#3a1b1b] border-b-2 border-[#ff4444] text-[#ff8888] p-2 text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Active Ticket Item List */}
        <div className="flex-1 p-3 overflow-y-auto bg-[#0d0e1c] font-mono text-xs space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12 vt323-font text-xl">
              <span>🛒</span>
              <span>{getText(language, 'noItemsInCart')}</span>
            </div>
          ) : (
            cart.map((item) => {
              const name =
                language === 'ID' && item.product.nameId
                  ? item.product.nameId
                  : item.product.name;
              return (
                <div
                  key={item.product.id}
                  className="bg-[#17192f] p-2 border border-[#00a88f] flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#e0e6f8] truncate">
                      {name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {formatPrice(item.product.price, language)} x {item.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="bg-[#0d0e1c] text-[#ff7700] px-2 py-0.5 border border-[#00a88f] font-bold text-xs hover:bg-[#ff7700] hover:text-[#121324]"
                    >
                      -
                    </button>
                    <span className="font-bold text-[#55ffd6] px-1 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="bg-[#0d0e1c] text-[#ff7700] px-2 py-0.5 border border-[#00a88f] font-bold text-xs hover:bg-[#ff7700] hover:text-[#121324]"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[65px]">
                    <div className="font-bold text-[#ff7700] vt323-font text-base">
                      {formatPrice(item.itemSubtotal, language)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      [x]
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals Section */}
        <div className="bg-[#17192f] border-t-2 border-[#00a88f] p-3 font-mono text-xs space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>{getText(language, 'subtotal')}:</span>
            <span className="font-bold">{formatPrice(rawSubtotal, language)}</span>
          </div>

          {/* Discount selector */}
          <div className="flex justify-between items-center text-gray-300">
            <span>{getText(language, 'discount')}:</span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    playKeyBeep();
                    setDiscountPercent(d);
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                    discountPercent === d
                      ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                      : 'bg-[#0d0e1c] text-[#00a88f] border-gray-700'
                  }`}
                >
                  {d}%
                </button>
              ))}
              <span className="text-red-400 ml-1 font-bold">
                -{formatPrice(discountAmount, language)}
              </span>
            </div>
          </div>

          {/* Tax selector */}
          <div className="flex justify-between items-center text-gray-300 py-0.5">
            <div className="flex items-center gap-1">
              <span>{getText(language, 'tax')}:</span>
              <span className="text-[10px] text-[#55ffd6] font-bold">({taxPercent}%)</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 2, 5, 10, 11].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    playKeyBeep();
                    setTaxPercent(t);
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-bold border transition-colors ${
                    taxPercent === t
                      ? 'bg-[#00a88f] text-[#121324] border-[#ff7700]'
                      : 'bg-[#0d0e1c] text-[#00a88f] border-gray-700 hover:border-[#00a88f]'
                  }`}
                  title={t === 0 ? (language === 'ID' ? 'Bebas Pajak (0%)' : 'Tax Exempt (0%)') : `${t}% Tax`}
                >
                  {t === 0 ? (language === 'ID' ? 'NON' : 'OFF') : `${t}%`}
                </button>
              ))}
              <button
                onClick={() => {
                  playKeyBeep();
                  setCustomTaxInput(taxPercent.toString());
                  setIsCustomTaxModalOpen(true);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-bold border transition-colors ${
                  ![0, 2, 5, 10, 11].includes(taxPercent)
                    ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                    : 'bg-[#0d0e1c] text-gray-400 border-gray-700 hover:text-white'
                }`}
                title={language === 'ID' ? 'Atur % Pajak Kustom' : 'Custom Tax %'}
              >
                ⚙️
              </button>
              <span className="font-bold text-[#55ffd6] ml-1">
                {formatPrice(taxAmount, language)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#00a88f]">
            <span className="vt323-font text-2xl font-bold text-[#ff7700]">
              {getText(language, 'total')}:
            </span>
            <span className="vt323-font text-3xl font-bold text-[#ff7700]">
              {formatPrice(grandTotal, language)}
            </span>
          </div>
        </div>

        {/* Process Payment Trigger Button */}
        <div className="bg-[#0d0e1c] border-t-2 border-[#00a88f] p-3">
          <button
            disabled={cart.length === 0}
            onClick={() => {
              if (cart.length === 0) {
                playErrorSound();
                setErrorMessage(getText(language, 'noItemsInCart'));
                return;
              }
              playKeyBeep();
              setErrorMessage('');
              if (!tenderedAmount || parseFloat(tenderedAmount) === 0) {
                setTenderedAmount(Math.round(grandTotal).toString());
              }
              setIsPaymentModalOpen(true);
            }}
            className={`retro-btn w-full py-3 text-xl vt323-font tracking-wider flex items-center justify-center gap-2 ${
              cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>💳</span>
            <span>
              {language === 'ID' ? 'PROSES PEMBAYARAN' : 'PROCESS PAYMENT'}
            </span>
          </button>
        </div>
      </section>

      {/* Payment Checkout Modal Popup */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm font-mono text-xs">
          <div className="retro-box w-full max-w-md bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
            <div className="retro-window-header-orange flex justify-between items-center px-3 py-2 border-b-2 border-[#00a88f]">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>💳</span>
                <span>
                  {language === 'ID'
                    ? 'PEMBAYARAN & CHECKOUT'
                    : 'PAYMENT & CHECKOUT'}
                </span>
              </div>
              <button
                onClick={() => {
                  playKeyBeep();
                  setIsPaymentModalOpen(false);
                  setErrorMessage('');
                }}
                className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
              {/* Grand Total Summary Display */}
              <div className="bg-[#0d0e1c] border-2 border-[#00a88f] p-3 text-center">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider block mb-0.5 font-bold">
                  {language === 'ID' ? 'TOTAL HARUS DIBAYAR' : 'TOTAL AMOUNT DUE'}
                </span>
                <span className="vt323-font text-3xl sm:text-4xl text-[#ff7700] font-bold block leading-none">
                  {formatPrice(grandTotal, language)}
                </span>
                <span className="text-[10px] text-[#00a88f] mt-1 block">
                  ({cart.reduce((s, i) => s + i.quantity, 0)} {language === 'ID' ? 'item dalam nota' : 'items in ticket'})
                </span>
              </div>

              {/* Payment Channel Selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-300 font-bold block">
                  {language === 'ID' ? 'METODE PEMBAYARAN:' : 'PAYMENT METHOD:'}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['CASH', 'QRIS', 'CARD', 'ONLINE_WEB'] as PaymentChannel[]).map(
                    (channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          playKeyBeep();
                          setPaymentChannel(channel);
                          setErrorMessage('');
                        }}
                        className={`py-1.5 text-xs font-bold uppercase vt323-font border transition-all ${
                          paymentChannel === channel
                            ? 'bg-[#00a88f] text-[#121324] border-[#55ffd6] shadow-[1px_1px_0px_#55ffd6]'
                            : 'bg-[#0d0e1c] text-[#00a88f] border-gray-700 hover:border-[#00a88f]'
                        }`}
                      >
                        {getText(
                          language,
                          channel === 'CASH'
                            ? 'cash'
                            : channel === 'QRIS'
                            ? 'qris'
                            : channel === 'CARD'
                            ? 'card'
                            : 'onlineWeb'
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Cash Controls */}
              {paymentChannel === 'CASH' ? (
                <div className="space-y-2 bg-[#0d0e1c] p-2.5 border border-[#00a88f]">
                  <div className="bg-[#121324] p-2 border border-[#00a88f] flex justify-between items-center">
                    <span className="text-xs text-[#00a88f] font-bold">
                      {getText(language, 'tendered')}:
                    </span>
                    <span className="vt323-font text-2xl text-[#55ffd6] font-bold">
                      {formatPrice(tenderedInUSD, language)}
                    </span>
                  </div>

                  {/* Exact Cash & Quick Presets */}
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <button
                      onClick={() => setExactTender(grandTotal)}
                      className="bg-[#17192f] border border-[#00a88f] text-[#ff7700] font-bold py-1 text-[10px] hover:bg-[#ff7700] hover:text-[#121324]"
                    >
                      {language === 'ID' ? 'UANG PAS' : 'EXACT'}
                    </button>
                    {[20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          playKeyBeep();
                          setTenderedAmount(amt.toString());
                        }}
                        className="bg-[#17192f] border border-[#00a88f] text-[#55ffd6] font-bold py-1 text-[10px] hover:bg-[#00a88f] hover:text-[#121324]"
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Compact Numpad Keypad */}
                  <div className="grid grid-cols-4 gap-1">
                    {['1', '2', '3', 'CLR', '4', '5', '6', 'BACK', '7', '8', '9', '00', '0', '.', '000'].map(
                      (btn) => (
                        <button
                          key={btn}
                          onClick={() => handleKeypadPress(btn)}
                          className={`py-1 text-xs sm:text-sm font-mono font-bold border transition-colors ${
                            btn === 'CLR'
                              ? 'bg-red-900 text-white border-red-500 hover:bg-red-800'
                              : btn === 'BACK'
                              ? 'bg-[#ff7700] text-[#121324] border-[#00a88f] hover:bg-white'
                              : 'bg-[#17192f] text-[#e0e6f8] border-gray-700 hover:border-[#00a88f]'
                          }`}
                        >
                          {btn}
                        </button>
                      )
                    )}
                  </div>

                  {/* Change Due Display */}
                  <div className="flex justify-between items-center bg-[#17192f] px-3 py-1.5 border border-[#00a88f] text-xs">
                    <span className="text-gray-300 font-bold">
                      {getText(language, 'change')}:
                    </span>
                    <span className="vt323-font text-2xl text-[#ff7700] font-bold">
                      {formatPrice(changeDueUSD, language)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0d0e1c] p-4 border border-[#00a88f] text-center space-y-2">
                  <div className="text-3xl">
                    {paymentChannel === 'QRIS'
                      ? '📱'
                      : paymentChannel === 'CARD'
                      ? '💳'
                      : '🌐'}
                  </div>
                  <div className="vt323-font text-xl text-[#00a88f] font-bold">
                    {paymentChannel === 'QRIS'
                      ? language === 'ID'
                        ? 'SIAP SCAN QRIS ALFAMART/INDOMARET/BCA'
                        : 'READY FOR QRIS PAY SCAN'
                      : paymentChannel === 'CARD'
                      ? language === 'ID'
                        ? 'GESEK / INSERT KARTU DEBIT/KREDIT DI MESIN EDC'
                        : 'INSERT OR SWIPE CARD ON EDC TERMINAL'
                      : language === 'ID'
                      ? 'PEMBAYARAN VIA GATEWAY WEB ONLINE'
                      : 'ONLINE PAYMENT GATEWAY'}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {language === 'ID'
                      ? 'Tekan [KONFIRMASI BAYAR] setelah transaksi di mesin/layar telah disetujui.'
                      : 'Click [CONFIRM PAYMENT] once customer transaction is approved.'}
                  </p>
                </div>
              )}

              {/* Error Message Alert in Modal */}
              {errorMessage && (
                <div className="bg-[#3a1b1b] border border-[#ff4444] text-[#ff8888] p-2 text-xs font-bold text-center animate-shake">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2 border-t border-[#00a88f]/30">
                <button
                  onClick={() => {
                    playKeyBeep();
                    setIsPaymentModalOpen(false);
                    setErrorMessage('');
                  }}
                  className="retro-btn-secondary flex-1 py-2"
                >
                  {getText(language, 'cancel')}
                </button>
                <button
                  onClick={handleCheckout}
                  className="retro-btn flex-1 py-2 font-bold text-base"
                >
                  ✓ {language === 'ID' ? 'KONFIRMASI BAYAR' : 'CONFIRM PAYMENT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Photo & Detailed Description Inspect Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm font-mono text-xs">
          <div className="retro-box w-full max-w-lg bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="retro-window-header-orange flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>👁️</span>
                <span>
                  {language === 'ID'
                    ? 'DETAIL PRODUK & FOTO SINKRON'
                    : 'PRODUCT PHOTO & DETAILS'}
                </span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Image Banner */}
              <div className="w-full h-52 bg-[#0d0e1c] border-2 border-[#00a88f] flex items-center justify-center overflow-hidden relative">
                {detailProduct.image ? (
                  <img
                    src={detailProduct.image}
                    alt={detailProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-6xl block mb-2">
                      {detailProduct.icon || '🛍️'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      (No Image Uploaded)
                    </span>
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-[#00a88f] text-[#121324] font-bold px-2 py-0.5 text-xs border border-black">
                  #{detailProduct.sku}
                </span>
              </div>

              {/* Title & Price Header */}
              <div className="flex justify-between items-start gap-2 border-b border-[#00a88f]/30 pb-3">
                <div>
                  <h3 className="vt323-font text-2xl font-bold text-[#e0e6f8] leading-tight">
                    {language === 'ID' && detailProduct.nameId
                      ? detailProduct.nameId
                      : detailProduct.name}
                  </h3>
                  {detailProduct.nameId && language !== 'ID' && (
                    <div className="text-gray-400 text-xs">
                      ID: {detailProduct.nameId}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-[#0d0e1c] text-[#00a88f] border border-[#00a88f] px-2 py-0.5 text-[10px] font-bold">
                      {detailProduct.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border ${
                        detailProduct.stock <= 0
                          ? 'bg-red-900 text-white border-red-500'
                          : detailProduct.stock <= 5
                          ? 'bg-[#ff7700] text-[#121324] border-black'
                          : 'bg-[#0d0e1c] text-[#55ffd6] border-[#00a88f]'
                      }`}
                    >
                      STOK: {detailProduct.stock} UNITS
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[#ff7700] vt323-font text-3xl font-bold">
                    {formatPrice(detailProduct.price, language)}
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="bg-[#0d0e1c] border border-[#00a88f] p-3 space-y-2">
                <div className="text-[#ff7700] font-bold flex items-center gap-1.5">
                  <span>📝</span>
                  <span>
                    {language === 'ID'
                      ? 'DESKRIPSI PRODUK DETAIL'
                      : 'DETAILED DESCRIPTION'}
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {(language === 'ID'
                    ? detailProduct.descriptionId || detailProduct.description
                    : detailProduct.description || detailProduct.descriptionId) ||
                    (language === 'ID'
                      ? 'Belum ada deskripsi detail untuk produk ini.'
                      : 'No detailed description available for this product.')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDetailProduct(null)}
                  className="retro-btn-secondary flex-1 py-2"
                >
                  {getText(language, 'close')}
                </button>
                <button
                  disabled={detailProduct.stock <= 0}
                  onClick={() => {
                    addToCart(detailProduct);
                    setDetailProduct(null);
                  }}
                  className={`retro-btn flex-1 py-2 ${
                    detailProduct.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  🛒 {language === 'ID' ? '+ BELI SEKARANG' : '+ ADD TO CART'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tax Rate Setting Modal */}
      {isCustomTaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm font-mono text-xs">
          <div className="retro-box w-full max-w-sm bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="retro-window-header-orange flex justify-between items-center p-2 border-b-2 border-[#00a88f]">
              <div className="flex items-center gap-2 font-bold">
                <span>⚙️</span>
                <span>{language === 'ID' ? 'PENGATURAN TARIF PAJAK' : 'TAX RATE CONFIGURATION'}</span>
              </div>
              <button
                onClick={() => setIsCustomTaxModalOpen(false)}
                className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-gray-200 font-bold">
                  {language === 'ID' ? 'Masukkan Persentase Pajak (%):' : 'Enter Tax Percentage (%):'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={customTaxInput}
                    onChange={(e) => setCustomTaxInput(e.target.value)}
                    className="retro-input w-full text-lg font-bold text-center pr-8"
                    placeholder="5"
                    autoFocus
                  />
                  <span className="absolute right-3 text-[#ff7700] font-bold text-base">%</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {language === 'ID'
                    ? 'Pilihan standar: 0% (Bebas Pajak), 1%-5% (Pajak Resto/PB1), 10%-11% (PPN).'
                    : 'Standard choices: 0% (Tax Exempt), 1%-5% (Local Tax), 10%-11% (VAT/PPN).'}
                </p>
              </div>

              {/* Quick Presets inside Modal */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block">
                  {language === 'ID' ? 'Opsi Cepat:' : 'Quick Presets:'}
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 1, 2, 5, 11].map((p) => (
                    <button
                      key={p}
                      onClick={() => setCustomTaxInput(p.toString())}
                      className="bg-[#0d0e1c] hover:bg-[#00a88f] text-[#55ffd6] hover:text-[#121324] border border-[#00a88f] py-1 text-[10px] font-bold"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#00a88f]/30">
                <button
                  onClick={() => setIsCustomTaxModalOpen(false)}
                  className="retro-btn-secondary flex-1 py-2"
                >
                  {getText(language, 'cancel')}
                </button>
                <button
                  onClick={() => {
                    playCashRegisterSound();
                    const parsed = Math.max(0, parseFloat(customTaxInput) || 0);
                    setTaxPercent(parsed);
                    setIsCustomTaxModalOpen(false);
                  }}
                  className="retro-btn flex-1 py-2"
                >
                  {getText(language, 'saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

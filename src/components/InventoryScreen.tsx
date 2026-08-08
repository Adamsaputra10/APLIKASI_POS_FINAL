import React, { useState } from 'react';
import { Language, Product, ProductCategory, Role } from '../types';
import { getText } from '../utils/i18n';
import { playCashRegisterSound, playKeyBeep } from '../utils/audio';
import { formatPrice } from '../utils/currency';

interface InventoryScreenProps {
  products: Product[];
  language: Language;
  currentRole: Role;
  onUpdateProduct: (product: Product) => void;
  onOpenAddProductModal: () => void;
  onOpenEditProductModal: (product: Product) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  language,
  currentRole,
  onUpdateProduct,
  onOpenAddProductModal,
  onOpenEditProductModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('ALL');
  const [quickStockItem, setQuickStockItem] = useState<Product | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<string>('10');

  const isManager = currentRole === 'MANAGER';

  // Critical Low Stock (< 10)
  const lowStockItems = products.filter((p) => p.stock <= 8);

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.category === selectedCategory;
    const name = language === 'ID' && p.nameId ? p.nameId : p.name;
    const matchesQuery =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockItem) return;
    const amt = parseInt(addStockAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    playCashRegisterSound();
    onUpdateProduct({
      ...quickStockItem,
      stock: quickStockItem.stock + amt,
    });
    setQuickStockItem(null);
    setAddStockAmount('10');
  };

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto p-2 md:p-4 pb-20 md:pb-8 space-y-4 font-mono">
      {/* Top Header Window */}
      <div className="retro-box overflow-hidden">
        <div className="retro-window-header-orange flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span>{getText(language, 'inventoryTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block bg-[#0d0e1c] text-[#55ffd6] text-[10px] px-2 py-0.5 border border-[#00a88f] font-mono font-bold">
              ⚡ STOK TERSINKRONIZASI WEB ILYASVIELSHOP
            </span>
            <div className="text-xs font-bold text-[#121324]">
              {products.length} PRODUCTS IN DB
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#121324] space-y-3">
          {/* Low Stock Warning Alert Banner */}
          {lowStockItems.length > 0 && (
            <div className="bg-[#3a1b1b] border-2 border-[#ff7700] p-3 text-xs text-[#ff7700] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                <span className="animate-ping">⚠️</span>
                <span>
                  {getText(language, 'criticalStock')}: {lowStockItems.length}{' '}
                  ITEMS NEED REORDER!
                </span>
              </div>
              <div className="flex gap-1 overflow-x-auto text-[10px]">
                {lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="bg-[#121324] text-[#ff7700] border border-[#ff7700] px-1.5 py-0.5 font-bold"
                  >
                    {item.name} ({item.stock})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search, Filter & Add New Product Controls */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-[#0d0e1c] p-3 border-2 border-[#00a88f]">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 top-2.5 text-[#ff7700]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getText(language, 'searchInventory')}
                className="retro-input w-full pl-9 py-1.5 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 overflow-x-auto w-full md:w-auto">
              {(['ALL', 'DRINKS', 'SNACKS', 'FOOD', 'MERCH'] as ProductCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playKeyBeep();
                      setSelectedCategory(cat);
                    }}
                    className={`px-2.5 py-1 text-xs vt323-font font-bold border ${
                      selectedCategory === cat
                        ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                        : 'bg-[#17192f] text-[#00a88f] border-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Add New Product Trigger */}
            <button
              onClick={() => {
                playKeyBeep();
                onOpenAddProductModal();
              }}
              className="retro-btn w-full md:w-auto px-4 py-1.5 text-xs whitespace-nowrap"
            >
              {getText(language, 'newProduct')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="retro-box overflow-hidden bg-[#121324] shadow-xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[780px] text-left text-xs font-mono border-collapse align-middle">
            <thead>
              <tr className="bg-[#00a88f] text-[#121324] vt323-font text-lg md:text-xl font-bold tracking-wider uppercase border-b-2 border-[#121324]">
                <th className="py-2.5 px-3 border-r border-[#121324] whitespace-nowrap text-center w-20">
                  {getText(language, 'sku')}
                </th>
                <th className="py-2.5 px-3 border-r border-[#121324] whitespace-nowrap text-center w-16">
                  {language === 'ID' ? 'FOTO' : 'PHOTO'}
                </th>
                <th className="py-2.5 px-3 border-r border-[#121324] text-left">
                  {getText(language, 'itemName')}
                </th>
                <th className="py-2.5 px-3 border-r border-[#121324] whitespace-nowrap text-center w-28">
                  {getText(language, 'category')}
                </th>
                <th className="py-2.5 px-3 border-r border-[#121324] whitespace-nowrap text-center w-28">
                  {getText(language, 'stockLvl')}
                </th>
                <th className="py-2.5 px-3 border-r border-[#121324] whitespace-nowrap text-right w-28">
                  {getText(language, 'price')}
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center w-36">
                  {getText(language, 'actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00a88f]/20">
              {filteredProducts.map((prod) => {
                const displayName =
                  language === 'ID' && prod.nameId ? prod.nameId : prod.name;
                const displayDesc =
                  language === 'ID'
                    ? prod.descriptionId || prod.description
                    : prod.description || prod.descriptionId;
                const isLow = prod.stock <= 8;

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-[#1a1c36] transition-colors align-middle"
                  >
                    {/* SKU Column (Center) */}
                    <td className="py-2.5 px-3 font-bold text-[#55ffd6] text-xs text-center whitespace-nowrap">
                      #{prod.sku}
                    </td>

                    {/* Image / Icon Thumbnail (Center) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-9 h-9 mx-auto bg-[#0d0e1c] border border-[#00a88f] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{prod.icon || '📦'}</span>
                        )}
                      </div>
                    </td>

                    {/* Product Name & Description (Left) */}
                    <td className="py-2.5 px-3 text-left">
                      <div className="font-bold text-[#e0e6f8] text-xs sm:text-sm leading-snug">
                        {displayName}
                      </div>
                      {displayDesc ? (
                        <div className="text-[10px] text-gray-400/75 line-clamp-1 max-w-xs sm:max-w-md font-mono mt-0.5">
                          {displayDesc}
                        </div>
                      ) : (
                        <div className="text-[10px] text-yellow-500/50 italic font-mono mt-0.5">
                          {language === 'ID' ? '(Belum ada deskripsi)' : '(No description)'}
                        </div>
                      )}
                    </td>

                    {/* Category Badge (Center) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block bg-[#0d0e1c] text-[#00a88f] border border-[#00a88f]/60 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        {prod.category}
                      </span>
                    </td>

                    {/* Stock Level Badge (Center) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 border text-[10px] tracking-wider ${
                          prod.stock <= 0
                            ? 'bg-[#cc2200] text-white border-red-500'
                            : isLow
                            ? 'bg-[#ff7700] text-[#121324] border-black animate-pulse'
                            : 'bg-[#0d0e1c] text-[#55ffd6] border-[#00a88f]/60'
                        }`}
                      >
                        {prod.stock <= 0 ? 'OUT OF STOCK' : `${prod.stock} UNITS`}
                      </span>
                    </td>

                    {/* Dynamic Localized Price (Right) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-[#ff7700] text-base vt323-font">
                      {formatPrice(prod.price, language)}
                    </td>

                    {/* Action Buttons (Center) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => {
                            playKeyBeep();
                            setQuickStockItem(prod);
                          }}
                          title={language === 'ID' ? 'Tambah Stok' : 'Add Stock'}
                          className="bg-[#17192f] hover:bg-[#00a88f] text-[#55ffd6] hover:text-[#121324] border border-[#00a88f] px-2 py-1 font-bold text-[11px] transition-colors"
                        >
                          {getText(language, 'addStock')}
                        </button>

                        <button
                          onClick={() => {
                            playKeyBeep();
                            onOpenEditProductModal(prod);
                          }}
                          title={language === 'ID' ? 'Edit Detail & Harga' : 'Edit Details & Price'}
                          className="bg-[#17192f] hover:bg-[#ff7700] text-[#ff7700] hover:text-[#121324] border border-[#ff7700] px-2 py-1 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>✏️</span>
                          <span>{getText(language, 'editPrice')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Incoming Stock Modal */}
      {quickStockItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="retro-box w-full max-w-sm bg-[#17192f] p-4 space-y-3 font-mono text-xs">
            <div className="retro-window-header-orange -m-4 mb-3">
              <span>➕ {getText(language, 'addStock')}</span>
              <button onClick={() => setQuickStockItem(null)}>✕</button>
            </div>

            <div className="text-gray-300">
              {getText(language, 'itemName')}:{' '}
              <span className="font-bold text-[#ff7700]">
                {quickStockItem.name}
              </span>
            </div>
            <div className="text-gray-300">
              Current Stock:{' '}
              <span className="font-bold text-[#55ffd6]">
                {quickStockItem.stock}
              </span>
            </div>

            <form onSubmit={handleQuickAddStock} className="space-y-3">
              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'enterAddStock')}
                </label>
                <input
                  type="number"
                  value={addStockAmount}
                  onChange={(e) => setAddStockAmount(e.target.value)}
                  className="retro-input w-full text-sm font-bold"
                  placeholder="10"
                />
              </div>

              <div className="flex gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddStockAmount(amt.toString())}
                    className="bg-[#0d0e1c] text-[#00a88f] border border-[#00a88f] px-2 py-1 text-xs font-bold"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickStockItem(null)}
                  className="retro-btn-secondary flex-1 py-1.5"
                >
                  {getText(language, 'cancel')}
                </button>
                <button type="submit" className="retro-btn flex-1 py-1.5">
                  💾 SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

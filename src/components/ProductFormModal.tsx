import React, { useState } from 'react';
import { Language, Product, ProductCategory } from '../types';
import { getText } from '../utils/i18n';
import { playCashRegisterSound, playErrorSound, playKeyBeep } from '../utils/audio';
import { getCurrencySymbol } from '../utils/currency';

interface ProductFormModalProps {
  isOpen: boolean;
  language: Language;
  onSaveProduct: (product: Omit<Product, 'id'> & { id?: string }) => void;
  onClose: () => void;
  existingProduct?: Product | null;
}

const PRESET_SAMPLE_PHOTOS = [
  { label: '☕ Kopi', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80' },
  { label: '🍦 Es Krim', url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80' },
  { label: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
  { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { label: '🥤 Latte', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80' },
  { label: '🍪 Cookies', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { label: '🧢 Topi', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80' },
  { label: '📼 Kaset', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  language,
  onSaveProduct,
  onClose,
  existingProduct,
}) => {
  const [name, setName] = useState(existingProduct?.name || '');
  const [nameId, setNameId] = useState(existingProduct?.nameId || '');
  const [sku, setSku] = useState(
    existingProduct?.sku || `RET-${Math.floor(100 + Math.random() * 900)}`
  );
  const [category, setCategory] = useState<ProductCategory>(
    existingProduct?.category || 'DRINKS'
  );
  const [price, setPrice] = useState(existingProduct?.price ? existingProduct.price.toString() : '20000');
  const [stock, setStock] = useState(existingProduct?.stock.toString() || '20');
  const [icon, setIcon] = useState(existingProduct?.icon || '📦');
  const [image, setImage] = useState(existingProduct?.image || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [descriptionId, setDescriptionId] = useState(existingProduct?.descriptionId || '');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const emojiOptions = ['☕', '🥤', '🍦', '🍕', '🍔', '🍪', '💧', '🧢', '📼', '👾', '🍿', '📦', '🍩', '🍟', '🍵'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      playErrorSound();
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      playErrorSound();
      setErrorMsg('Ukuran file maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            setImage(compressedBase64);
            setErrorMsg('');
            playKeyBeep();
          }
        };
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      playErrorSound();
      setErrorMsg('Nama barang dan SKU wajib diisi.');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
      playErrorSound();
      setErrorMsg('Harga dan stok harus berupa angka positif.');
      return;
    }

    playCashRegisterSound();
    onSaveProduct({
      id: existingProduct?.id,
      name: name.trim().toUpperCase(),
      nameId: nameId.trim().toUpperCase() || name.trim().toUpperCase(),
      sku: sku.trim().toUpperCase(),
      category,
      price: priceNum,
      stock: stockNum,
      icon,
      image: image.trim(),
      description: description.trim(),
      descriptionId: descriptionId.trim() || description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm font-mono text-xs overflow-hidden">
      <div
        style={{ maxHeight: '85vh' }}
        className="retro-box w-full max-w-xl bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[85vh] flex flex-col shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh] overflow-hidden flex-1">
          {/* Retro Window Header - Fixed Top */}
          <div className="retro-window-header-orange flex-shrink-0 flex justify-between items-center px-3 py-2 border-b-2 border-[#00a88f]">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <span>📦</span>
              <span>
                {existingProduct
                  ? (language === 'ID' ? 'EDIT PRODUK POS & WEB' : 'EDIT POS & WEB PRODUCT')
                  : (language === 'ID' ? 'TAMBAH PRODUK BARU' : 'ADD NEW PRODUCT')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                playKeyBeep();
                onClose();
              }}
              className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="p-3 sm:p-4 space-y-3.5 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="bg-[#3a1b1b] border-2 border-[#ff4444] text-[#ff8888] p-2 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Grid Layout for Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Name EN */}
              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'itemName')} (EN) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="RETRO COFFEE"
                  className="retro-input w-full text-xs"
                  required
                />
              </div>

              {/* Name ID */}
              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'itemName')} (Bahasa Indonesia)
                </label>
                <input
                  type="text"
                  value={nameId}
                  onChange={(e) => setNameId(e.target.value)}
                  placeholder="KOPI RETRO"
                  className="retro-input w-full text-xs"
                />
              </div>
            </div>

            {/* SKU, Category, Price & Stock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'sku')} *
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="RET-999"
                  className="retro-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="retro-input w-full text-xs bg-[#0d0e1c]"
                >
                  <option value="DRINKS">DRINKS</option>
                  <option value="SNACKS">SNACKS</option>
                  <option value="FOOD">FOOD</option>
                  <option value="MERCH">MERCH</option>
                </select>
              </div>

              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  HARGA (Rp) *
                </label>
                <input
                  type="number"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="20000"
                  className="retro-input w-full text-xs font-bold text-[#ff7700]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#00a88f] font-bold mb-1">
                  {getText(language, 'stockLvl')}
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className="retro-input w-full text-xs"
                  required
                />
              </div>
            </div>

            {/* 1. UNGGAH FOTO PRODUK (File Uploader / Image URL) */}
            <div className="bg-[#0d0e1c] p-3 space-y-2.5 border-t border-b border-[#00a88f]/30">
              <div className="flex justify-between items-center">
                <label className="text-[#ff7700] font-bold flex items-center gap-1.5 text-xs">
                  <span>🖼️</span>
                  <span>{language === 'ID' ? 'FOTO PRODUK (SINKRON WEB ONLINE)' : 'PRODUCT PHOTO'}</span>
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => {
                      playKeyBeep();
                      setImage('');
                    }}
                    className="text-red-400 hover:text-red-200 text-[10px] underline font-bold"
                  >
                    {language === 'ID' ? '[ HAPUS FOTO ]' : '[ CLEAR PHOTO ]'}
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {/* Kiri: Kotak Pratinjau Gambar (NO PHOTO) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#121324] border-2 border-[#00a88f] flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner">
                  {image ? (
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setErrorMsg(language === 'ID' ? 'Gagal memuat URL gambar.' : 'Failed to load image URL.')}
                    />
                  ) : (
                    <div className="text-center p-2 flex flex-col items-center justify-center">
                      <span className="text-2xl block mb-1">{icon || '📷'}</span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider">NO PHOTO</span>
                    </div>
                  )}
                </div>

                {/* Kanan: Tombol Unggah di atas, kolom input URL di bawah secara terpisah */}
                <div className="flex-1 w-full space-y-2.5 min-w-0">
                  {/* Tombol Unggah Dari Perangkat */}
                  <div>
                    <label className="retro-btn w-full py-1.5 px-3 text-center cursor-pointer text-xs flex items-center justify-center gap-2 transition-all">
                      <span>📁</span>
                      <span>{language === 'ID' ? 'UNGGAH DARI PERANGKAT' : 'UPLOAD FROM DEVICE'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Kolom Input URL Foto Berada di Bawah Secara Terpisah */}
                  <div>
                    <label className="block text-[10px] text-[#00a88f] font-bold mb-1">
                      {language === 'ID' ? 'ATAU TEMPEL URL FOTO:' : 'OR PASTE IMAGE URL:'}
                    </label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder={
                        language === 'ID'
                          ? 'https://images.unsplash.com/...'
                          : 'https://images.unsplash.com/...'
                      }
                      className="retro-input w-full text-xs"
                    />
                  </div>

                  {/* Preset Sample Photos */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">
                      {language === 'ID' ? 'Atau pilih foto contoh:' : 'Or select sample photo:'}
                    </span>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playKeyBeep();
                            setImage(p.url);
                          }}
                          className={`text-[10px] px-2 py-0.5 border whitespace-nowrap transition-colors ${
                            image === p.url
                              ? 'bg-[#ff7700] text-[#121324] font-bold border-[#00a88f]'
                              : 'bg-[#17192f] text-[#00a88f] border-gray-700 hover:border-[#00a88f]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DESKRIPSI PRODUK SECARA DETAIL (Textarea) */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[#00a88f] font-bold mb-1 flex justify-between items-center">
                  <span>📝 {language === 'ID' ? 'DESKRIPSI PRODUK (BAHASA INDONESIA)' : 'DETAILED DESCRIPTION (ID)'}</span>
                  <span className="text-[10px] text-gray-400">Tampil di Web Pelanggan</span>
                </label>
                <textarea
                  rows={2}
                  value={descriptionId}
                  onChange={(e) => setDescriptionId(e.target.value)}
                  placeholder={
                    language === 'ID'
                      ? 'Tuliskan deskripsi lengkap produk, bahan, cita rasa, komposisi...'
                      : 'Write detailed product description, ingredients...'
                  }
                  className="retro-input w-full text-xs font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[#00a88f] font-bold mb-1 flex justify-between items-center">
                  <span>📝 {language === 'ID' ? 'DESKRIPSI PRODUK (ENGLISH)' : 'DETAILED DESCRIPTION (EN)'}</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="English detailed product overview..."
                  className="retro-input w-full text-xs font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Icon Selector (Fallback Icon) */}
            <div>
              <label className="block text-[#00a88f] font-bold mb-1 text-xs">
                PIXEL EMOJI ICON (FALLBACK)
              </label>
              <div className="flex gap-1.5 overflow-x-auto p-1.5 bg-[#0d0e1c] border border-[#00a88f]/40">
                {emojiOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      playKeyBeep();
                      setIcon(e);
                    }}
                    className={`p-1 text-base border transition-colors ${
                      icon === e
                        ? 'bg-[#ff7700] border-[#00a88f]'
                        : 'border-transparent hover:border-[#00a88f]/50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Action Buttons - Sticky Bottom */}
          <div className="flex-shrink-0 bg-[#0d0e1c] p-3 border-t-2 border-[#00a88f] flex gap-3 z-10">
            <button
              type="button"
              onClick={() => {
                playKeyBeep();
                onClose();
              }}
              className="retro-btn-secondary flex-1 py-2 text-xs font-bold"
            >
              {getText(language, 'cancel')}
            </button>
            <button type="submit" className="retro-btn flex-1 py-2 text-xs font-bold">
              💾 {getText(language, 'saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


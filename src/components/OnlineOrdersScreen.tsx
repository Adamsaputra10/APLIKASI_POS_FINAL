import React, { useState } from 'react';
import { Language, OnlineOrder, OnlineOrderStatus } from '../types';
import { getText } from '../utils/i18n';
import { formatPrice } from '../utils/currency';
import { playKeyBeep } from '../utils/audio';

interface OnlineOrdersScreenProps {
  language: Language;
  orders: OnlineOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OnlineOrderStatus) => void;
  onSimulateNewOrder?: () => void;
}

export const OnlineOrdersScreen: React.FC<OnlineOrdersScreenProps> = ({
  language,
  orders,
  onUpdateOrderStatus,
  onSimulateNewOrder,
}) => {
  const [filterStatus, setFilterStatus] = useState<OnlineOrderStatus | 'ALL'>('ALL');

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    return order.status === filterStatus;
  });

  // Calculate status counts
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const getStatusBadge = (status: OnlineOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-[#3a3000] text-[#ffdd00] border-2 border-[#ffaa00] px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#ffaa00]/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#ffaa00]"></span>
            <span>{getText(language, 'statusPending')}</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="bg-[#002b55] text-[#66c2ff] border-2 border-[#0088ff] px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#0088ff]/30">
            <span className="w-2 h-2 rounded-full bg-[#0088ff] animate-ping"></span>
            <span>{getText(language, 'statusProcessing')}</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="bg-[#340055] text-[#e099ff] border-2 border-[#aa00ff] px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#aa00ff]/30">
            <span>🚚</span>
            <span>{getText(language, 'statusShipped')}</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-[#003a1d] text-[#55ff99] border-2 border-[#00aa55] px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1.5">
            <span>✅</span>
            <span>{getText(language, 'statusCompleted')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto p-2 md:p-4 pb-20 md:pb-8 space-y-4 font-mono">
      {/* Top Header Window */}
      <div className="retro-box overflow-hidden">
        <div className="retro-window-header-orange flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <span className="text-sm md:text-base">
              {getText(language, 'onlineOrdersTitle')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSimulateNewOrder && (
              <button
                onClick={() => {
                  playKeyBeep();
                  onSimulateNewOrder();
                }}
                className="bg-[#121324] hover:bg-[#ffaa00] hover:text-[#121324] text-[#ffaa00] border border-[#ffaa00] px-2 py-0.5 text-[11px] font-bold transition-all flex items-center gap-1 shadow-[1px_1px_0px_#ffaa00]"
                title={language === 'ID' ? 'Kirim simulasi pesanan web baru ke Supabase Realtime' : 'Send simulated new web order to Supabase Realtime'}
              >
                <span>⚡</span>
                <span className="hidden sm:inline">SIMULASI PESANAN</span>
              </button>
            )}
            <div className="text-xs bg-[#121324] text-[#ff7700] px-2 py-0.5 border border-[#ff7700]">
              WEB_GATEWAY_v1999
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-[#17192f] space-y-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                playKeyBeep();
                setFilterStatus('ALL');
              }}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                filterStatus === 'ALL'
                  ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                  : 'bg-[#0d0e1c] text-[#00a88f] border-[#00a88f]/50 hover:border-[#00a88f]'
              }`}
            >
              <span>{language === 'ID' ? 'SEMUA' : 'ALL'}</span>
              <span className="bg-[#121324] text-[#ff7700] px-1.5 py-0.2 text-[10px] rounded">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                playKeyBeep();
                setFilterStatus('PENDING');
              }}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                filterStatus === 'PENDING'
                  ? 'bg-[#ffaa00] text-[#121324] border-[#ffaa00]'
                  : 'bg-[#0d0e1c] text-[#ffdd00] border-[#ffaa00]/50 hover:border-[#ffaa00]'
              }`}
            >
              <span>{getText(language, 'statusPending')}</span>
              {pendingCount > 0 && (
                <span className="bg-[#cc2200] text-white px-1.5 py-0.2 text-[10px] font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playKeyBeep();
                setFilterStatus('PROCESSING');
              }}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                filterStatus === 'PROCESSING'
                  ? 'bg-[#0088ff] text-[#121324] border-[#0088ff]'
                  : 'bg-[#0d0e1c] text-[#66c2ff] border-[#0088ff]/50 hover:border-[#0088ff]'
              }`}
            >
              <span>{getText(language, 'statusProcessing')}</span>
              {processingCount > 0 && (
                <span className="bg-[#0055aa] text-white px-1.5 py-0.2 text-[10px]">
                  {processingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playKeyBeep();
                setFilterStatus('SHIPPED');
              }}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                filterStatus === 'SHIPPED'
                  ? 'bg-[#aa00ff] text-white border-[#aa00ff]'
                  : 'bg-[#0d0e1c] text-[#e099ff] border-[#aa00ff]/50 hover:border-[#aa00ff]'
              }`}
            >
              <span>{getText(language, 'statusShipped')}</span>
              {shippedCount > 0 && (
                <span className="bg-[#6600aa] text-white px-1.5 py-0.2 text-[10px]">
                  {shippedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playKeyBeep();
                setFilterStatus('COMPLETED');
              }}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                filterStatus === 'COMPLETED'
                  ? 'bg-[#00aa55] text-[#121324] border-[#00aa55]'
                  : 'bg-[#0d0e1c] text-[#55ff99] border-[#00aa55]/50 hover:border-[#00aa55]'
              }`}
            >
              <span>{getText(language, 'statusCompleted')}</span>
              {completedCount > 0 && (
                <span className="bg-[#00552b] text-white px-1.5 py-0.2 text-[10px]">
                  {completedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order Cards Inbox Grid */}
      {filteredOrders.length === 0 ? (
        <div className="retro-box p-8 text-center text-gray-400 bg-[#17192f]">
          <span className="text-4xl block mb-2">📥</span>
          <p className="vt323-font text-xl text-[#00a88f]">
            {language === 'ID'
              ? 'TIDAK ADA PESANAN WEB DALAM KATEGORI INI'
              : 'NO WEB ORDERS IN THIS CATEGORY'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {language === 'ID'
              ? 'Pesanan web baru yang masuk dari pelanggan akan otomatis muncul di sini secara Realtime.'
              : 'New web orders placed by customers will automatically appear here in Realtime.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order, idx) => (
            <div key={`${order.id}-${idx}`} className="retro-box overflow-hidden bg-[#121324] flex flex-col justify-between">
              {/* Card Header Bar */}
              <div className="bg-[#1a1c36] p-3 border-b-2 border-[#00a88f] flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ff7700] text-[#121324] font-bold px-2 py-0.5 text-xs vt323-font text-base border border-[#00a88f]">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-[#55ffd6] font-bold">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    ⏱ {order.timestamp}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="p-3 bg-[#0d0e1c] border-b border-[#00a88f]/30 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#00a88f] font-bold">
                    👤 {getText(language, 'customerName')}:
                  </span>
                  <span className="font-bold text-[#e0e6f8]">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#00a88f] font-bold">
                    📞 {getText(language, 'phone')}:
                  </span>
                  <span className="text-gray-300">{order.customerPhone}</span>
                </div>
                <div className="text-xs text-gray-400 border-t border-[#00a88f]/20 pt-1">
                  <span className="text-[#00a88f] font-bold mr-1">📍 {getText(language, 'deliveryAddress')}:</span>
                  <span>{order.customerAddress}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[#00a88f]/20 pt-1">
                  <span className="text-[#00a88f] font-bold">🚚 {language === 'ID' ? 'Ekspedisi & Ongkir' : 'Courier & Fee'}:</span>
                  <span className="text-[#55ffd6] font-bold">
                    {order.courier || 'Ekspedisi Standard'}
                    {order.shippingFee && order.shippingFee > 0 ? ` (${formatPrice(order.shippingFee, language)})` : ''}
                  </span>
                </div>

                {order.trackingNumber && (
                  <div className="flex justify-between items-center text-xs bg-[#1a1c36] p-1.5 border border-[#aa00ff] text-[#e099ff] font-bold">
                    <span>📦 {language === 'ID' ? 'No. Resi Pengiriman' : 'Tracking Resi'}:</span>
                    <span className="font-mono tracking-wider text-[#ffaa00]">{order.trackingNumber}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="text-[11px] text-[#ffdd00] bg-[#222000] p-1.5 border border-[#ffaa00]/40 italic">
                    <span className="font-bold">📝 {language === 'ID' ? 'Catatan' : 'Notes'}: </span>
                    <span>{order.notes}</span>
                  </div>
                )}
              </div>

              {/* Purchased Items List */}
              <div className="p-3 flex-1 space-y-2">
                <div className="text-xs font-bold text-[#ff7700] flex justify-between items-center border-b border-[#00a88f]/30 pb-1">
                  <span>🛍️ {getText(language, 'itemsPurchased')}</span>
                  <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)} Items</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs bg-[#17192f] p-1.5 border border-[#00a88f]/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-[#00a88f] text-[#121324] font-bold px-1.5 py-0.2 text-[10px]">
                          {item.quantity}x
                        </span>
                        <span className="text-[#e0e6f8] font-bold">{item.name}</span>
                      </div>
                      <div className="text-[#55ffd6] vt323-font text-sm font-bold">
                        {formatPrice(item.price * item.quantity, language)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Payment & Action Buttons Footer */}
              <div className="p-3 bg-[#17192f] border-t-2 border-[#00a88f] space-y-2.5">
                <div className="flex justify-between items-center bg-[#0d0e1c] p-2 border border-[#00a88f]">
                  <span className="text-xs font-bold text-[#00a88f]">
                    {getText(language, 'paymentDetails')}:
                  </span>
                  <span className="vt323-font text-2xl font-bold text-[#ff7700]">
                    {formatPrice(order.totalPayment, language)}
                  </span>
                </div>

                {/* Cashier Action Controls */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        playKeyBeep();
                        onUpdateOrderStatus(order.id, 'PROCESSING');
                      }}
                      className="retro-btn flex-1 py-1.5 text-xs bg-[#ffaa00] hover:bg-[#ffbb22] text-[#121324] border-[#00a88f] flex items-center justify-center gap-1.5"
                    >
                      <span>⚡</span>
                      <span>{getText(language, 'processOrder')}</span>
                    </button>
                  )}

                  {order.status === 'PROCESSING' && (
                    <>
                      <button
                        onClick={() => {
                          playKeyBeep();
                          onUpdateOrderStatus(order.id, 'SHIPPED');
                        }}
                        className="retro-btn-secondary flex-1 py-1.5 text-xs text-[#66c2ff] border-[#0088ff] hover:bg-[#002b55] flex items-center justify-center gap-1.5"
                      >
                        <span>🚚</span>
                        <span>{getText(language, 'markShipped')}</span>
                      </button>

                      <button
                        onClick={() => {
                          playKeyBeep();
                          onUpdateOrderStatus(order.id, 'COMPLETED');
                        }}
                        className="retro-btn flex-1 py-1.5 text-xs bg-[#00aa55] hover:bg-[#00cc66] text-[#121324] border-[#00a88f] flex items-center justify-center gap-1.5"
                      >
                        <span>✅</span>
                        <span>{getText(language, 'markCompleted')}</span>
                      </button>
                    </>
                  )}

                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => {
                        playKeyBeep();
                        onUpdateOrderStatus(order.id, 'COMPLETED');
                      }}
                      className="retro-btn flex-1 py-1.5 text-xs bg-[#00aa55] hover:bg-[#00cc66] text-[#121324] border-[#00a88f] flex items-center justify-center gap-1.5"
                    >
                      <span>✅</span>
                      <span>{getText(language, 'markCompleted')}</span>
                    </button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <div className="w-full bg-[#0d0e1c] border border-[#00aa55] p-1.5 text-center text-[11px] text-[#55ff99] font-bold flex items-center justify-center gap-2">
                      <span>✔</span>
                      <span>
                        {language === 'ID'
                          ? 'PESANAN SELESAI & STOK TERPOTONG'
                          : 'ORDER COMPLETED & STOCK DEDUCTED'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

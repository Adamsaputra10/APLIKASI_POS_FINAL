import React, { useState } from 'react';
import { Language, SaleTransaction, ShiftState } from '../types';
import { getText } from '../utils/i18n';
import { playKeyBeep } from '../utils/audio';
import { formatPrice } from '../utils/currency';

interface DashboardScreenProps {
  transactions: SaleTransaction[];
  language: Language;
  shiftState: ShiftState;
  onOpenReceiptModal: (transaction: SaleTransaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  transactions,
  language,
  shiftState,
  onOpenReceiptModal,
}) => {
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE_WEB' | 'OFFLINE_STORE'>('ALL');
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Combined Daily Revenue
  const totalCombinedRevenue = transactions.reduce((sum, t) => sum + t.total, 0);

  // Online Web Orders vs Offline Store Sales
  const onlineWebRevenue = transactions
    .filter((t) => t.type === 'ONLINE_WEB')
    .reduce((sum, t) => sum + t.total, 0);

  const offlineStoreRevenue = transactions
    .filter((t) => t.type === 'OFFLINE_STORE')
    .reduce((sum, t) => sum + t.total, 0);

  // Cash vs Digital breakdown
  const cashSales = transactions
    .filter((t) => t.channel === 'CASH')
    .reduce((sum, t) => sum + t.total, 0);

  const digitalSales = transactions
    .filter((t) => t.channel !== 'CASH')
    .reduce((sum, t) => sum + t.total, 0);

  const totalCashDrawer = shiftState.startingCash + cashSales;

  // Filter logs
  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter =
      channelFilter === 'ALL' || t.type === channelFilter;
    const matchesQuery =
      t.orderNumber.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      t.cashierName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      t.items.some((i) => i.name.toLowerCase().includes(searchLogQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  // Export CSV
  const handleExportCSV = () => {
    playKeyBeep();
    const headers = [
      'Order Number',
      'Timestamp',
      'Channel',
      'Type',
      'Items Count',
      'Subtotal',
      'Tax',
      'Total',
      'Cashier',
    ];
    const rows = transactions.map((t) => [
      t.orderNumber,
      t.timestamp,
      t.channel,
      t.type,
      t.items.reduce((acc, i) => acc + i.quantity, 0),
      t.subtotal.toFixed(2),
      t.tax.toFixed(2),
      t.total.toFixed(2),
      t.cashierName,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `retroshop_sales_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto p-2 md:p-4 pb-20 md:pb-8 space-y-4 font-mono">
      {/* Header Bar */}
      <div className="retro-box overflow-hidden">
        <div className="retro-window-header-orange flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>{getText(language, 'dashboardTitle')}</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-[#121324] text-[#ff7700] hover:bg-[#ff7700] hover:text-[#121324] border border-black px-2 py-0.5 text-xs font-bold transition-all"
          >
            📥 {getText(language, 'exportCsv')}
          </button>
        </div>

        {/* Section 1: Combined Daily Revenue Summary Cards */}
        <div className="p-4 bg-[#121324] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Combined Total */}
          <div className="bg-[#17192f] border-2 border-[#ff7700] p-4 relative overflow-hidden group">
            <div className="text-[10px] text-[#ff7700] font-bold tracking-wider">
              {getText(language, 'totalRevenue')}
            </div>
            <div className="vt323-font text-4xl text-[#ff7700] font-bold my-1">
              {formatPrice(totalCombinedRevenue, language)}
            </div>
            <div className="text-[10px] text-gray-400 flex justify-between pt-2 border-t border-gray-800">
              <span>{getText(language, 'totalTransactions')}:</span>
              <span className="font-bold text-[#55ffd6]">{transactions.length}</span>
            </div>
          </div>

          {/* Online Web Sales */}
          <div className="bg-[#17192f] border-2 border-[#00a88f] p-4">
            <div className="text-[10px] text-[#00a88f] font-bold tracking-wider flex justify-between">
              <span>🌐 {getText(language, 'onlineSales')}</span>
              <span className="text-xs">
                {totalCombinedRevenue > 0
                  ? ((onlineWebRevenue / totalCombinedRevenue) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="vt323-font text-3xl text-[#55ffd6] font-bold my-1">
              {formatPrice(onlineWebRevenue, language)}
            </div>
            <div className="w-full bg-[#0d0e1c] h-2 border border-[#00a88f] overflow-hidden">
              <div
                className="bg-[#00a88f] h-full"
                style={{
                  width: `${
                    totalCombinedRevenue > 0
                      ? (onlineWebRevenue / totalCombinedRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Offline Store Sales */}
          <div className="bg-[#17192f] border-2 border-[#00a88f] p-4">
            <div className="text-[10px] text-[#00a88f] font-bold tracking-wider flex justify-between">
              <span>🏬 {getText(language, 'offlineSales')}</span>
              <span className="text-xs">
                {totalCombinedRevenue > 0
                  ? ((offlineStoreRevenue / totalCombinedRevenue) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="vt323-font text-3xl text-[#55ffd6] font-bold my-1">
              {formatPrice(offlineStoreRevenue, language)}
            </div>
            <div className="w-full bg-[#0d0e1c] h-2 border border-[#00a88f] overflow-hidden">
              <div
                className="bg-[#ff7700] h-full"
                style={{
                  width: `${
                    totalCombinedRevenue > 0
                      ? (offlineStoreRevenue / totalCombinedRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Estimated Cash Drawer */}
          <div className="bg-[#17192f] border-2 border-[#00a88f] p-4">
            <div className="text-[10px] text-[#00a88f] font-bold tracking-wider">
              💵 {getText(language, 'cashInDrawer')}
            </div>
            <div className="vt323-font text-3xl text-[#ff7700] font-bold my-1">
              {formatPrice(totalCashDrawer, language)}
            </div>
            <div className="text-[10px] text-gray-400 flex justify-between pt-1">
              <span>Modal: {formatPrice(shiftState.startingCash, language)}</span>
              <span>Tunai: {formatPrice(cashSales, language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Retro Pixel Bar Chart Area */}
      <div className="retro-box overflow-hidden bg-[#121324] p-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-[#00a88f] font-bold">
          <span>📈 REVENUE BREAKDOWN BY PAYMENT CHANNEL</span>
          <span className="text-[10px] text-gray-400">REALTIME AUDIT STREAM</span>
        </div>

        {/* Pixel Bar Chart */}
        <div className="bg-[#0d0e1c] p-4 border-2 border-[#00a88f] space-y-3">
          {/* Cash */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">💵 CASH (TUNAI)</span>
              <span className="text-[#55ffd6] font-bold">{formatPrice(cashSales, language)}</span>
            </div>
            <div className="w-full bg-[#17192f] h-4 border border-[#00a88f] overflow-hidden">
              <div
                className="bg-[#00a88f] h-full transition-all duration-500"
                style={{
                  width: `${
                    totalCombinedRevenue > 0 ? (cashSales / totalCombinedRevenue) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Digital (QRIS / Card / Online) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">📱 DIGITAL (QRIS / EDC / WEB)</span>
              <span className="text-[#ff7700] font-bold">{formatPrice(digitalSales, language)}</span>
            </div>
            <div className="w-full bg-[#17192f] h-4 border border-[#00a88f] overflow-hidden">
              <div
                className="bg-[#ff7700] h-full transition-all duration-500"
                style={{
                  width: `${
                    totalCombinedRevenue > 0
                      ? (digitalSales / totalCombinedRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Activity Log Table */}
      <div className="retro-box overflow-hidden bg-[#121324]">
        <div className="retro-window-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>📜</span>
            <span>{getText(language, 'salesLog')}</span>
          </div>
          <div className="text-xs text-[#121324] font-bold">
            {filteredTransactions.length} LOG RECORDS
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#0d0e1c] p-3 border-b-2 border-[#00a88f] flex flex-col md:flex-row gap-3 justify-between items-center text-xs">
          {/* Search Log */}
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-2 text-[#ff7700]">🔍</span>
            <input
              type="text"
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              placeholder="Search Order #, Cashier, Item..."
              className="retro-input w-full pl-8 py-1 text-xs"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                playKeyBeep();
                setChannelFilter('ALL');
              }}
              className={`px-3 py-1 font-bold border vt323-font text-sm ${
                channelFilter === 'ALL'
                  ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                  : 'bg-[#17192f] text-[#00a88f] border-gray-700'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => {
                playKeyBeep();
                setChannelFilter('OFFLINE_STORE');
              }}
              className={`px-3 py-1 font-bold border vt323-font text-sm ${
                channelFilter === 'OFFLINE_STORE'
                  ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                  : 'bg-[#17192f] text-[#00a88f] border-gray-700'
              }`}
            >
              🏬 STORE
            </button>
            <button
              onClick={() => {
                playKeyBeep();
                setChannelFilter('ONLINE_WEB');
              }}
              className={`px-3 py-1 font-bold border vt323-font text-sm ${
                channelFilter === 'ONLINE_WEB'
                  ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
                  : 'bg-[#17192f] text-[#00a88f] border-gray-700'
              }`}
            >
              🌐 ONLINE
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#00a88f] text-[#121324] vt323-font text-lg font-bold">
                <th className="p-2 border-r border-[#121324]">{getText(language, 'time')}</th>
                <th className="p-2 border-r border-[#121324]">{getText(language, 'orderId')}</th>
                <th className="p-2 border-r border-[#121324]">{getText(language, 'channel')}</th>
                <th className="p-2 border-r border-[#121324]">{getText(language, 'items')}</th>
                <th className="p-2 border-r border-[#121324] text-right">{getText(language, 'total')}</th>
                <th className="p-2 text-center">RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTransactions.map((tx, idx) => (
                <tr
                  key={`${tx.id}-${idx}`}
                  onClick={() => {
                    playKeyBeep();
                    onOpenReceiptModal(tx);
                  }}
                  className="hover:bg-[#1a1c36] transition-colors cursor-pointer"
                >
                  <td className="p-2 text-gray-400 whitespace-nowrap">
                    {tx.timestamp.substring(11, 19)}
                  </td>
                  <td className="p-2 font-bold text-[#55ffd6]">
                    #{tx.orderNumber}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold border ${
                        tx.type === 'ONLINE_WEB'
                          ? 'bg-[#00a88f] text-[#121324] border-[#55ffd6]'
                          : 'bg-[#ff7700] text-[#121324] border-black'
                      }`}
                    >
                      {tx.type === 'ONLINE_WEB' ? 'ONLINE WEB' : tx.channel}
                    </span>
                  </td>
                  <td className="p-2 text-gray-300">
                    {tx.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-2 text-right font-bold text-[#ff7700] vt323-font text-lg">
                    {formatPrice(tx.total, language)}
                  </td>
                  <td className="p-2 text-center">
                    <span className="bg-[#0d0e1c] text-[#00a88f] border border-[#00a88f] px-2 py-0.5 text-[10px] font-bold hover:bg-[#ff7700] hover:text-[#121324]">
                      🖨️ VIEW
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

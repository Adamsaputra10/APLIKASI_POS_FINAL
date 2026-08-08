import React from 'react';
import { ActiveTab, Language, Role } from '../types';
import { getText } from '../utils/i18n';
import { playKeyBeep } from '../utils/audio';
import { PixelIconPOS, PixelIconStock, PixelIconReports, PixelIconWebOrders } from './PixelIcons';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: Language;
  currentRole: Role;
  lowStockCount: number;
  pendingOrdersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  language,
  lowStockCount,
  pendingOrdersCount = 0,
}) => {
  const handleTabClick = (tab: ActiveTab) => {
    playKeyBeep();
    onTabChange(tab);
  };

  return (
    <nav
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', zIndex: 9999 }}
      className="fixed bottom-0 left-0 right-0 w-full h-[60px] md:h-[64px] z-[9999] bg-[#17192f] border-t-4 border-[#00a88f] flex justify-around items-center px-1 sm:px-2 shadow-2xl"
    >
      <button
        onClick={() => handleTabClick('POS')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 mx-0.5 sm:mx-1 md:mx-2 max-w-xs border-2 transition-all ${
          activeTab === 'POS'
            ? 'bg-[#ff7700] text-[#121324] font-bold border-[#00a88f] shadow-[2px_2px_0px_#00a88f]'
            : 'bg-[#0d0e1c] text-[#00a88f] border-transparent hover:border-[#00a88f]/50'
        }`}
      >
        <PixelIconPOS size={18} color={activeTab === 'POS' ? '#121324' : '#00a88f'} />
        <span className="text-[10px] sm:text-xs md:text-sm vt323-font font-bold mt-0.5 tracking-wider whitespace-nowrap">
          {getText(language, 'navPos')}
        </span>
      </button>

      <button
        onClick={() => handleTabClick('INVENTORY')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 mx-0.5 sm:mx-1 md:mx-2 max-w-xs border-2 relative transition-all ${
          activeTab === 'INVENTORY'
            ? 'bg-[#ff7700] text-[#121324] font-bold border-[#00a88f] shadow-[2px_2px_0px_#00a88f]'
            : 'bg-[#0d0e1c] text-[#00a88f] border-transparent hover:border-[#00a88f]/50'
        }`}
      >
        <PixelIconStock size={18} color={activeTab === 'INVENTORY' ? '#121324' : '#00a88f'} />
        <span className="text-[10px] sm:text-xs md:text-sm vt323-font font-bold mt-0.5 tracking-wider whitespace-nowrap">
          {getText(language, 'navInventory')}
        </span>
        {lowStockCount > 0 && (
          <span className="absolute -top-1 right-0.5 bg-[#cc2200] text-white text-[9px] px-1 font-bold border border-[#ff7700] animate-pulse">
            {lowStockCount}
          </span>
        )}
      </button>

      <button
        onClick={() => handleTabClick('ONLINE_ORDERS')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 mx-0.5 sm:mx-1 md:mx-2 max-w-xs border-2 relative transition-all ${
          activeTab === 'ONLINE_ORDERS'
            ? 'bg-[#ff7700] text-[#121324] font-bold border-[#00a88f] shadow-[2px_2px_0px_#00a88f]'
            : 'bg-[#0d0e1c] text-[#00a88f] border-transparent hover:border-[#00a88f]/50'
        }`}
      >
        <PixelIconWebOrders size={18} color={activeTab === 'ONLINE_ORDERS' ? '#121324' : '#00a88f'} />
        <span className="text-[10px] sm:text-xs md:text-sm vt323-font font-bold mt-0.5 tracking-wider whitespace-nowrap">
          {getText(language, 'navOnlineOrders')}
        </span>
        {pendingOrdersCount > 0 && (
          <span className="absolute -top-1 right-0.5 bg-[#ffaa00] text-[#121324] text-[9px] px-1 font-bold border border-[#00a88f] animate-pulse">
            {pendingOrdersCount}
          </span>
        )}
      </button>

      <button
        onClick={() => handleTabClick('REPORTS')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 mx-0.5 sm:mx-1 md:mx-2 max-w-xs border-2 transition-all ${
          activeTab === 'REPORTS'
            ? 'bg-[#ff7700] text-[#121324] font-bold border-[#00a88f] shadow-[2px_2px_0px_#00a88f]'
            : 'bg-[#0d0e1c] text-[#00a88f] border-transparent hover:border-[#00a88f]/50'
        }`}
      >
        <PixelIconReports size={18} color={activeTab === 'REPORTS' ? '#121324' : '#00a88f'} />
        <span className="text-[10px] sm:text-xs md:text-sm vt323-font font-bold mt-0.5 tracking-wider whitespace-nowrap">
          {getText(language, 'navReports')}
        </span>
      </button>
    </nav>
  );
};


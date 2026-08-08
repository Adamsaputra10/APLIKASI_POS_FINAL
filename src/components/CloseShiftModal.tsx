import React, { useState } from 'react';
import { Language, ShiftState, SaleTransaction } from '../types';
import { getText } from '../utils/i18n';
import { playCashRegisterSound, playKeyBeep } from '../utils/audio';
import { formatPrice } from '../utils/currency';

interface CloseShiftModalProps {
  isOpen: boolean;
  language: Language;
  shiftState: ShiftState;
  transactions: SaleTransaction[];
  onConfirmCloseShift: () => void;
  onCancel: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  language,
  shiftState,
  transactions,
  onConfirmCloseShift,
  onCancel,
}) => {
  const [actualCashInput, setActualCashInput] = useState<string>('');

  if (!isOpen) return null;

  // Calculate totals from transactions recorded during shift
  const cashSales = transactions
    .filter((t) => t.channel === 'CASH')
    .reduce((sum, t) => sum + t.total, 0);

  const digitalSales = transactions
    .filter((t) => t.channel !== 'CASH')
    .reduce((sum, t) => sum + t.total, 0);

  const expectedCashInDrawer = shiftState.startingCash + cashSales;
  const actualCashNum = parseFloat(actualCashInput) || expectedCashInDrawer;
  const discrepancy = actualCashNum - expectedCashInDrawer;

  const handleClose = () => {
    playCashRegisterSound();
    onConfirmCloseShift();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-3 sm:p-4 font-mono text-xs overflow-hidden">
      <div className="retro-box w-[92%] sm:w-full max-w-lg bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Retro Header */}
        <div className="retro-window-header-orange flex-shrink-0 flex justify-between items-center px-3 py-2 border-b-2 border-[#00a88f]">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#121324]">
            <span>📋</span>
            <span>{getText(language, 'shiftSummaryTitle')}</span>
          </div>
          <button
            onClick={() => {
              playKeyBeep();
              onCancel();
            }}
            className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black transition-colors"
            title={language === 'ID' ? 'Tutup' : 'Close'}
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 font-mono text-xs overflow-y-auto flex-1">
          {/* Staff Info Banner */}
          <div className="bg-[#0d0e1c] border-2 border-[#00a88f] p-3 text-xs flex justify-between items-center">
            <div>
              <div className="text-gray-400">{getText(language, 'loggedAs')}</div>
              <div className="text-[#ff7700] font-bold text-sm">
                {shiftState.staffUser?.name} ({shiftState.staffUser?.role})
              </div>
            </div>
            <div className="text-right text-[#55ffd6]">
              <div>{getText(language, 'shiftOpenedAt')}</div>
              <div>{shiftState.openedAt ? new Date(shiftState.openedAt).toLocaleTimeString() : '14:00'}</div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="space-y-2 bg-[#0d0e1c] border-2 border-[#00a88f] p-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span className="text-gray-300">{getText(language, 'openedStartingCash')}:</span>
              <span className="text-[#ff7700] font-bold">{formatPrice(shiftState.startingCash, language)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-gray-300">{getText(language, 'cashSalesCounted')}:</span>
              <span className="text-[#55ffd6] font-bold">+{formatPrice(cashSales, language)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-gray-300">{getText(language, 'digitalSalesCounted')}:</span>
              <span className="text-[#55ffd6] font-bold">+{formatPrice(digitalSales, language)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-[#00a88f] text-sm">
              <span className="text-[#ff7700] font-bold">{getText(language, 'expectedCashInDrawer')}:</span>
              <span className="text-[#ff7700] vt323-font text-2xl font-bold">
                {formatPrice(expectedCashInDrawer, language)}
              </span>
            </div>
          </div>

          {/* Audit Actual Cash Count */}
          <div className="bg-[#121324] p-3 border-2 border-[#ff7700] space-y-2">
            <label className="block text-[#ff7700] font-bold">
              💵 {getText(language, 'actualCashInput')}
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                placeholder={expectedCashInDrawer.toFixed(2)}
                className="retro-input w-full text-base font-bold"
              />
            </div>

            {/* Discrepancy Indicator */}
            <div className="flex justify-between items-center text-xs pt-1">
              <span>{getText(language, 'discrepancy')}:</span>
              <span
                className={`font-bold ${
                  discrepancy === 0
                    ? 'text-[#55ffd6]'
                    : discrepancy > 0
                    ? 'text-[#00a88f]'
                    : 'text-[#ff4444]'
                }`}
              >
                {discrepancy >= 0
                  ? `+${formatPrice(discrepancy, language)}`
                  : `-${formatPrice(Math.abs(discrepancy), language)}`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                playKeyBeep();
                onCancel();
              }}
              className="retro-btn-secondary flex-1 py-2 text-sm"
            >
              {getText(language, 'cancel')}
            </button>
            <button
              onClick={handleClose}
              className="retro-btn bg-[#cc2200] hover:bg-[#ff3311] text-white flex-1 py-2 text-sm"
            >
              🔒 {getText(language, 'confirmCloseShift')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

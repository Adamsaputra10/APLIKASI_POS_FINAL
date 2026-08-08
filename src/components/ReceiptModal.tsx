import React, { useState } from 'react';
import { Language, SaleTransaction } from '../types';
import { getText } from '../utils/i18n';
import { playPrinterSound, playKeyBeep } from '../utils/audio';
import { formatPrice } from '../utils/currency';

interface ReceiptModalProps {
  isOpen: boolean;
  transaction: SaleTransaction | null;
  language: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  transaction,
  language,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    playPrinterSound();
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="retro-box w-full max-w-md bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Retro Header */}
        <div className="retro-window-header-orange">
          <div className="flex items-center gap-2">
            <span>🖨️</span>
            <span>{getText(language, 'receiptTitle')}</span>
          </div>
          <button
            onClick={() => {
              playKeyBeep();
              onClose();
            }}
            className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="p-4 bg-[#121324] space-y-4">
          <div className="bg-[#f0f4ea] text-[#121324] font-mono p-5 shadow-2xl border-2 border-black space-y-3 text-xs leading-tight select-all">
            {/* Store Header */}
            <div className="text-center font-bold tracking-widest uppercase border-b-2 border-dashed border-black pb-2 space-y-1">
              <div className="text-sm vt323-font">{getText(language, 'storeHeader')}</div>
              <div className="text-[10px]">JAKARTA - INDONESIA</div>
              <div className="text-[10px]">TEL: +62 21 1999-0404</div>
            </div>

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>{getText(language, 'receiptNo')}:</span>
                <span className="font-bold">#{transaction.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{getText(language, 'date')}:</span>
                <span>{transaction.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>{getText(language, 'cashierLabel')}:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>{getText(language, 'paymentType')}:</span>
                <span className="font-bold">{transaction.channel}</span>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-1.5 border-b-2 border-dashed border-black pb-2">
              <div className="flex justify-between font-bold text-[11px]">
                <span>ITEM</span>
                <span>QTY x PRICE = TOTAL</span>
              </div>
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <div className="font-bold truncate max-w-[150px]">{item.name}</div>
                  <div>
                    {item.quantity} x {formatPrice(item.price, language)} = {formatPrice(item.quantity * item.price, language)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-[11px] border-b-2 border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>{getText(language, 'subtotal')}:</span>
                <span>{formatPrice(transaction.subtotal, language)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>{getText(language, 'discount')}:</span>
                  <span>-{formatPrice(transaction.discount, language)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{getText(language, 'tax')}:</span>
                <span>{formatPrice(transaction.tax, language)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                <span>{getText(language, 'total')}:</span>
                <span>{formatPrice(transaction.total, language)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>{getText(language, 'tendered')}:</span>
                <span>{formatPrice(transaction.tendered, language)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{getText(language, 'change')}:</span>
                <span>{formatPrice(transaction.change, language)}</span>
              </div>
            </div>

            {/* Thank You Footer */}
            <div className="text-center font-bold text-[10px] pt-1 uppercase">
              <div>{getText(language, 'thankYou')}</div>
              <div className="text-[9px] mt-1 font-mono">POWERED BY RETROSHOP v1999</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                playKeyBeep();
                onClose();
              }}
              className="retro-btn-secondary flex-1 py-2 text-xs"
            >
              {getText(language, 'close')}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="retro-btn flex-1 py-2 text-xs flex items-center justify-center gap-1"
            >
              <span>🖨️</span>
              <span>{isPrinting ? getText(language, 'printing') : getText(language, 'printReceipt')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

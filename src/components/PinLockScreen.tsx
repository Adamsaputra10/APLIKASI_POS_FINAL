import React, { useState, useEffect } from 'react';
import { Language, Role, StaffUser } from '../types';
import { playCashRegisterSound, playErrorSound, playKeyBeep } from '../utils/audio';

interface PinLockScreenProps {
  isOpen: boolean;
  language: Language;
  onUnlock: (staffUser: StaffUser) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  isOpen,
  language,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          playKeyBeep();
          setPin((prev) => prev + e.key);
          setErrorMsg('');
        }
      } else if (e.key === 'Backspace') {
        playKeyBeep();
        setPin((prev) => prev.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Enter') {
        handleCheckPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length < 6) {
      playKeyBeep();
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    playKeyBeep();
    setPin('');
    setErrorMsg('');
  };

  const handleBackspace = () => {
    playKeyBeep();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleCheckPin = (inputPin: string = pin) => {
    if (!inputPin) {
      playErrorSound();
      setErrorMsg(language === 'ID' ? 'Silakan masukkan PIN!' : 'Please enter a PIN!');
      return;
    }

    // Default PIN check:
    // 1234 -> Cashier (Alex - Cashier)
    // 9999 -> Manager (Sarah - Store Manager)
    if (inputPin === '1234') {
      playCashRegisterSound();
      const staff: StaffUser = {
        username: 'cashier',
        name: 'Alex (Kasir)',
        role: 'CASHIER',
      };
      setPin('');
      setErrorMsg('');
      onUnlock(staff);
    } else if (inputPin === '9999') {
      playCashRegisterSound();
      const staff: StaffUser = {
        username: 'manager',
        name: 'Sarah (Store Manager)',
        role: 'MANAGER',
      };
      setPin('');
      setErrorMsg('');
      onUnlock(staff);
    } else {
      playErrorSound();
      setErrorMsg(
        language === 'ID'
          ? 'PIN SALAH! PIN Default: 1234 (Kasir) / 9999 (Manager)'
          : 'INVALID PIN! Default PIN: 1234 (Cashier) / 9999 (Manager)'
      );
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[20000] bg-[#090a14] bg-opacity-95 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs overflow-hidden scanlines">
      <div className="retro-box w-full max-w-sm bg-[#17192f] border-4 border-[#00a88f] shadow-[0_0_30px_rgba(0,168,143,0.3)] animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="retro-window-header-orange flex justify-between items-center px-3 py-2 border-b-2 border-[#00a88f]">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#121324] vt323-font text-xl">
            <span>🔒</span>
            <span>ILYASVIELSHOP POS - TERMINAL LOCKED</span>
          </div>
          <span className="text-[10px] bg-[#121324] text-[#ff7700] px-1.5 py-0.5 border border-black font-bold">
            SECURITY_v1.0
          </span>
        </div>

        {/* Pin Screen Content Body */}
        <div className="p-4 space-y-4 text-center">
          {/* Subtitle Header */}
          <div className="bg-[#0d0e1c] border border-[#00a88f] p-3 space-y-1">
            <h2 className="vt323-font text-2xl font-bold text-[#ff7700] tracking-wider">
              {language === 'ID' ? 'MASUKKAN PIN TERMINAL KASIR' : 'ENTER TERMINAL POS PIN'}
            </h2>
            <p className="text-[11px] text-[#55ffd6]">
              {language === 'ID'
                ? 'PIN Default: 1234 (Kasir) | 9999 (Manager)'
                : 'Default PIN: 1234 (Cashier) | 9999 (Manager)'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-[#3a1b1b] border-2 border-[#ff4444] text-[#ff8888] p-2 text-xs font-bold animate-bounce">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* PIN Display Input Field */}
          <div className="bg-[#0d0e1c] border-2 border-[#ff7700] p-3 flex justify-center items-center min-h-[52px] shadow-inner">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-8 h-10 border-2 flex items-center justify-center font-bold vt323-font text-2xl ${
                    pin.length > idx
                      ? 'border-[#00a88f] bg-[#00a88f]/20 text-[#55ffd6]'
                      : 'border-gray-700 bg-[#121324] text-gray-600'
                  }`}
                >
                  {pin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Retro Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="bg-[#121324] border-2 border-[#00a88f] text-[#55ffd6] vt323-font text-2xl font-bold py-2.5 hover:bg-[#00a88f] hover:text-[#121324] active:scale-95 transition-all shadow-[2px_2px_0px_#00a88f]"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="bg-[#3a1b1b] border-2 border-[#ff4444] text-[#ff8888] vt323-font text-xl font-bold py-2.5 hover:bg-[#ff4444] hover:text-white active:scale-95 transition-all"
              title="Clear"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="bg-[#121324] border-2 border-[#00a88f] text-[#55ffd6] vt323-font text-2xl font-bold py-2.5 hover:bg-[#00a88f] hover:text-[#121324] active:scale-95 transition-all shadow-[2px_2px_0px_#00a88f]"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="bg-[#1a1c36] border-2 border-[#ff7700] text-[#ff7700] vt323-font text-xl font-bold py-2.5 hover:bg-[#ff7700] hover:text-[#121324] active:scale-95 transition-all"
              title="Backspace"
            >
              ⌫
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            onClick={() => handleCheckPin()}
            className="retro-btn w-full py-3 text-sm vt323-font text-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-[3px_3px_0px_#00a88f]"
          >
            <span>🔓</span>
            <span>{language === 'ID' ? 'BUKA TERMINAL KASIR' : 'UNLOCK POS TERMINAL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Language, Role, StaffUser } from '../types';
import { getText } from '../utils/i18n';
import { playCashRegisterSound, playErrorSound, playKeyBeep } from '../utils/audio';
import { getCurrencySymbol } from '../utils/currency';

interface LoginShiftModalProps {
  isOpen: boolean;
  language: Language;
  onOpenShift: (staffUser: StaffUser, startingCash: number) => void;
  onCloseModal?: () => void;
}

export const LoginShiftModal: React.FC<LoginShiftModalProps> = ({
  isOpen,
  language,
  onOpenShift,
  onCloseModal,
}) => {
  const [username, setUsername] = useState('cashier');
  const [password, setPassword] = useState('1234');
  const [role, setRole] = useState<Role>('CASHIER');
  const [startingCash, setStartingCash] = useState<string>('100.00');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const fillCashierDemo = () => {
    playKeyBeep();
    setUsername('cashier');
    setPassword('1234');
    setRole('CASHIER');
    setStartingCash('100.00');
    setErrorMessage('');
  };

  const fillManagerDemo = () => {
    playKeyBeep();
    setUsername('manager');
    setPassword('admin123');
    setRole('MANAGER');
    setStartingCash('250.00');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      playErrorSound();
      setErrorMessage(
        language === 'ID'
          ? 'Nama pengguna & kata sandi wajib diisi.'
          : 'Username and password are required.'
      );
      return;
    }

    const startingCashNum = parseFloat(startingCash);
    if (isNaN(startingCashNum) || startingCashNum < 0) {
      playErrorSound();
      setErrorMessage(
        language === 'ID'
          ? 'Modal awal harus berupa angka valid (0 atau lebih).'
          : 'Starting cash must be a valid non-negative number.'
      );
      return;
    }

    // Authenticate
    const displayName =
      role === 'MANAGER' ? 'Sarah - Store Manager' : `Alex (${username})`;

    const staff: StaffUser = {
      username: username.trim(),
      name: displayName,
      role: role,
    };

    playCashRegisterSound();
    onOpenShift(staff, startingCashNum);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-3 sm:p-4 font-mono text-xs overflow-hidden">
      <div className="retro-box w-[92%] sm:w-full max-w-md bg-[#17192f] overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Retro Window Header */}
        <div className="retro-window-header-orange flex-shrink-0 flex justify-between items-center px-3 py-2 border-b-2 border-[#00a88f]">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#121324]">
            <span className="text-base sm:text-lg">🔐</span>
            <span>{getText(language, 'loginTitle')}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playKeyBeep();
              onCloseModal?.();
            }}
            className="bg-[#121324] text-white px-2 py-0.5 border border-black font-bold hover:bg-[#ff7700] hover:text-black transition-colors"
            title={language === 'ID' ? 'Tutup' : 'Close'}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          {/* Info Banner */}
          <div className="bg-[#0d0e1c] border-2 border-[#00a88f] p-2.5 text-xs text-[#55ffd6] font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00a88f] animate-ping"></span>
              <span>{getText(language, 'systemStatus')}</span>
            </div>
            <span className="text-[#ff7700]">PIN: 1234 / 9999</span>
          </div>

          {errorMessage && (
            <div className="bg-[#3a1b1b] border-2 border-[#ff4444] text-[#ff8888] p-2.5 text-xs font-bold">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 text-xs font-mono">
            {/* Username */}
            <div>
              <label className="block text-[#00a88f] font-bold mb-1">
                {getText(language, 'username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cashier"
                className="retro-input w-full text-xs sm:text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#00a88f] font-bold mb-1">
                {getText(language, 'password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="retro-input w-full text-xs sm:text-sm"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[#00a88f] font-bold mb-1">
                {getText(language, 'role')}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="retro-input w-full text-xs sm:text-sm bg-[#0d0e1c]"
              >
                <option value="CASHIER">{getText(language, 'cashier')}</option>
                <option value="MANAGER">{getText(language, 'manager')}</option>
              </select>
            </div>

            {/* Starting Cash Balance / Modal Awal */}
            <div className="bg-[#0d0e1c] p-2.5 sm:p-3 border-2 border-[#ff7700]">
              <label className="block text-[#ff7700] font-bold mb-1">
                💰 {getText(language, 'startingCash')}
              </label>
              <div className="flex items-center gap-0">
                <div className="bg-[#17192f] text-[#55ffd6] font-bold text-xs sm:text-sm px-3 py-2 border-2 border-r-0 border-[#00a88f] flex items-center justify-center min-w-[50px] select-none">
                  {getCurrencySymbol(language)}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  placeholder="100.00"
                  className="retro-input w-full text-sm sm:text-base font-bold flex-1"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {language === 'ID'
                  ? 'Jumlah uang tunai yang disiapkan di laci kas saat awal shift.'
                  : 'Cash drawer starting amount at shift open.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onCloseModal && (
                <button
                  type="button"
                  onClick={() => {
                    playKeyBeep();
                    onCloseModal();
                  }}
                  className="retro-btn-secondary flex-1 py-2 text-xs sm:text-sm font-bold"
                >
                  {getText(language, 'cancel')}
                </button>
              )}
              <button
                type="submit"
                className="retro-btn flex-1 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                <span>{getText(language, 'openShift')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

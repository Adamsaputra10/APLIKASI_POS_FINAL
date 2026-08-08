import React, { useState, useEffect } from 'react';
import { Language, ShiftState } from '../types';
import { getText } from '../utils/i18n';
import { isSoundEnabled, setSoundEnabled, playKeyBeep } from '../utils/audio';
import { PixelIconTheme } from './PixelIcons';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  shiftState: ShiftState;
  onOpenShiftModal: () => void;
  onCloseShiftModal: () => void;
  showScanlines: boolean;
  onToggleScanlines: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  shiftState,
  onOpenShiftModal,
  onCloseShiftModal,
  showScanlines,
  onToggleScanlines,
  theme,
  onToggleTheme,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSoundToggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playKeyBeep();
  };

  return (
    <header className="flex-shrink-0 z-40 bg-[#17192f] border-b-4 border-[#00a88f] px-4 py-2 flex flex-wrap justify-between items-center text-[#e0e6f8] shadow-lg">
      {/* Brand & Terminal Indicator */}
      <div className="flex items-center gap-3">
        <div className="bg-[#ff7700] text-[#121324] font-bold px-2 py-0.5 text-xs vt323-font text-lg tracking-wider border-2 border-[#00a88f]">
          POS_v1999
        </div>
        <h1 className="vt323-font text-2xl md:text-3xl font-bold tracking-wider text-[#ff7700] drop-shadow-[2px_2px_0px_#000]">
          ILYASVIELSHOP POS & MANAGER DASHBOARD
        </h1>
        <div className="hidden sm:flex items-center gap-2 bg-[#0d0e1c] border border-[#00a88f] px-2 py-0.5 text-xs text-[#55ffd6]">
          <span className="w-2 h-2 rounded-full bg-[#00a88f] animate-pulse"></span>
          <span>{getText(language, 'systemStatus')}</span>
        </div>
      </div>

      {/* Center Clock & Shift Badge */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="bg-[#0d0e1c] border border-[#00a88f] px-3 py-1 font-mono text-sm text-[#ff7700]">
          ⏱ {timeStr || '14:00:00'}
        </div>

        {shiftState.isOpen ? (
          <div className="flex items-center gap-2 bg-[#1a2e2b] border border-[#00a88f] px-3 py-1 text-xs">
            <span className="text-[#55ffd6]">● {getText(language, 'shiftStatus')}:</span>
            <span className="font-bold text-[#ff7700]">{shiftState.staffUser?.name}</span>
            <span className="text-gray-400">({shiftState.staffUser?.role})</span>
            <span className="bg-[#ff7700] text-[#121324] font-bold px-1.5 py-0.2 ml-1 text-[11px]">
              MODAL: ${shiftState.startingCash.toFixed(2)}
            </span>
          </div>
        ) : (
          <div className="bg-[#3a1b1b] border border-[#ff4444] px-3 py-1 text-xs text-[#ff8888] font-bold animate-pulse">
            ⚠️ SHIFT CLOSED
          </div>
        )}
      </div>

      {/* Right Controls: Sound, Scanlines, Theme, Lang, Shift Action (Icon Only with Tooltips) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Audio Toggle */}
        <button
          onClick={handleSoundToggle}
          title={
            soundOn
              ? language === 'ID'
                ? 'Suara 8-Bit: Aktif (Klik untuk Matikan)'
                : '8-Bit Sound: ON (Click to Mute)'
              : language === 'ID'
              ? 'Suara 8-Bit: Mute (Klik untuk Aktifkan)'
              : '8-Bit Sound: MUTE (Click to Enable)'
          }
          className={`px-2 py-1.5 text-sm font-bold border-2 transition-all ${
            soundOn
              ? 'bg-[#00a88f] text-[#121324] border-[#55ffd6]'
              : 'bg-[#1a1c36] text-gray-400 border-gray-600 hover:border-[#00a88f]'
          }`}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>

        {/* Retro Light Mode Toggle */}
        <button
          onClick={() => {
            playKeyBeep();
            onToggleTheme();
          }}
          title={
            theme === 'light'
              ? language === 'ID'
                ? 'Mode Terang (Klik untuk Mode Gelap)'
                : 'Light Mode (Click for Dark Mode)'
              : language === 'ID'
              ? 'Mode Gelap (Klik untuk Mode Terang)'
              : 'Dark Mode (Click for Light Mode)'
          }
          className={`px-2 py-1.5 text-sm font-bold border-2 flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'bg-[#ff7700] text-[#121324] border-[#00a88f]'
              : 'bg-[#0d0e1c] text-[#55ffd6] border-[#00a88f]'
          }`}
        >
          <PixelIconTheme isLight={theme === 'light'} size={18} />
        </button>

        {/* CRT Scanline Toggle */}
        <button
          onClick={() => {
            playKeyBeep();
            onToggleScanlines();
          }}
          title={
            showScanlines
              ? language === 'ID'
                ? 'Efek TV CRT: Aktif (Klik untuk Matikan)'
                : 'CRT Scanlines: ON (Click to Disable)'
              : language === 'ID'
              ? 'Efek TV CRT: Mati (Klik untuk Aktifkan)'
              : 'CRT Scanlines: OFF (Click to Enable)'
          }
          className={`px-2 py-1.5 text-sm font-bold border-2 transition-all ${
            showScanlines
              ? 'bg-[#00a88f] text-[#121324] border-[#55ffd6]'
              : 'bg-[#1a1c36] text-gray-400 border-gray-600 hover:border-[#00a88f]'
          }`}
        >
          📺
        </button>

        {/* Language Switcher Icon Button */}
        <button
          onClick={() => {
            playKeyBeep();
            onLanguageChange(language === 'EN' ? 'ID' : 'EN');
          }}
          title={
            language === 'ID'
              ? 'Bahasa Indonesia (Klik untuk Switch ke English EN)'
              : 'English (Click to Switch to Bahasa Indonesia ID)'
          }
          className="bg-[#0d0e1c] hover:bg-[#ff7700] hover:text-[#121324] text-[#00a88f] border-2 border-[#00a88f] px-2 py-1.5 text-xs font-bold transition-all flex items-center gap-1"
        >
          <span>🌐</span>
          <span className="text-[10px] font-mono tracking-tighter">{language}</span>
        </button>

        {/* Primary Shift / Login Button */}
        {shiftState.isOpen ? (
          <button
            onClick={() => {
              playKeyBeep();
              onCloseShiftModal();
            }}
            title={language === 'ID' ? 'Tutup Shift Kasir (Tampilkan Rekapan Shift)' : 'Close Cashier Shift (Show Shift Summary)'}
            className="retro-btn bg-[#cc2200] hover:bg-[#ff3311] text-white border-[#00a88f] text-xs px-2.5 py-1.5 flex items-center justify-center gap-1 font-bold shadow-[2px_2px_0px_#000]"
          >
            <span>🔒</span>
            <span className="hidden sm:inline">{language === 'ID' ? 'TUTUP SHIFT' : 'CLOSE SHIFT'}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              playKeyBeep();
              onOpenShiftModal();
            }}
            title={language === 'ID' ? 'Login Kasir / Masuk Shift' : 'Cashier Login / Enter Shift'}
            className="retro-btn text-xs px-2.5 py-1.5 flex items-center justify-center gap-1 font-bold shadow-[2px_2px_0px_#00a88f]"
          >
            <span>🔓</span>
            <span className="hidden sm:inline">{language === 'ID' ? 'LOGIN / MASUK' : 'LOGIN / MASUK'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

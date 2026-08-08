import React, { useEffect } from 'react';

export interface ToastData {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-16 right-4 z-[30000] max-w-sm w-full animate-in slide-in-from-bottom-5 font-mono text-xs">
      <div
        className={`p-3 border-2 shadow-2xl flex items-start gap-2.5 ${
          isSuccess
            ? 'bg-[#003a1d] text-[#55ff99] border-[#00aa55]'
            : isError
            ? 'bg-[#3a1b1b] text-[#ff8888] border-[#ff4444]'
            : 'bg-[#17192f] text-[#55ffd6] border-[#00a88f]'
        }`}
      >
        <span className="text-lg leading-none">
          {isSuccess ? '✅' : isError ? '❌' : 'ℹ️'}
        </span>
        <div className="flex-1 font-bold leading-tight">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold ml-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

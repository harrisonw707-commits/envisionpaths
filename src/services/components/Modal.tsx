import React, { useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-2xl bg-theme-surface border border-theme rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-theme">
          <h2 id={titleId} className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter text-theme-primary truncate pr-4">{title}</h2>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-theme-surface-hover rounded-full transition-colors text-theme-secondary hover:text-theme-primary"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <div className="p-6 border-t border-theme flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-theme-surface-hover hover:opacity-80 text-theme-primary font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

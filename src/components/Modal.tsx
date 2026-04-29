import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-theme-surface border border-theme rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-theme">
              <h2 className="text-lg md:text-xl font-black uppercase italic text-theme-primary tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-theme-surface-hover rounded-xl transition-colors text-theme-secondary hover:text-theme-primary"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 md:p-6 max-h-[85vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

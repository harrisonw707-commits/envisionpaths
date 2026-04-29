import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-theme';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-theme';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-theme';
      case 'top':
      default:
        return 'absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-theme';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: position === 'bottom' ? -5 : position === 'top' ? 5 : 0,
              x: position === 'right' ? -5 : position === 'left' ? 5 : 0,
              scale: 0.95 
            }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: position === 'bottom' ? -5 : position === 'top' ? 5 : 0,
              x: position === 'right' ? -5 : position === 'left' ? 5 : 0,
              scale: 0.95 
            }}
            className={`absolute ${getPositionClasses()} px-3 py-1.5 bg-theme-surface border border-theme rounded-lg shadow-xl z-[1100] whitespace-nowrap`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">{content}</p>
            <div className={`absolute ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;

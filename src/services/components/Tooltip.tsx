import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-red-600',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-red-600',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-red-600',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-red-600',
  };

  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': tooltipId,
      } as any)}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
          >
            <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded shadow-xl whitespace-nowrap border border-red-500/30">
              {content}
              <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select an option', hasError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative font-mono text-sm" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[54px] bg-transparent border p-4 flex items-center justify-between cursor-pointer transition-colors rounded-lg ${hasError ? 'border-[#fe0000]' : isOpen ? 'border-[#fe0000]' : 'border-[var(--color-border)] hover:border-[#fe0000]/50'}`}
      >
        <span className={value ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#fe0000]' : 'text-[var(--color-muted)]'}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] top-full mt-2 left-0 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
              {options.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`p-4 flex items-center justify-between cursor-pointer border-b border-[var(--color-border)] last:border-b-0 transition-colors ${value === opt ? 'bg-[#fe0000]/10 text-[#fe0000]' : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'}`}
                >
                  <span className="truncate pr-4">{opt}</span>
                  {value === opt && <Check size={16} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

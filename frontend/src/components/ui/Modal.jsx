import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-navy-900 border border-navy-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-8`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/40">
          <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-navy-800 text-slate-300 border-navy-700',
    cyan: 'bg-sky-950/70 text-accent-cyan border-sky-800/50',
    emerald: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50',
    amber: 'bg-amber-950/70 text-amber-400 border-amber-800/50',
    rose: 'bg-rose-950/70 text-rose-400 border-rose-800/50',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-navy-800/70 rounded-lg ${className}`} />
  );
}

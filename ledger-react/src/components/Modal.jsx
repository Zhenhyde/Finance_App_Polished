import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Ledger from './components/Ledger';
import CreditSnapshot from './components/CreditSnapshot';
import CreditLadder from './components/CreditLadder';
import BAHCalculator from './components/BAHCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState('ledger');

  const renderTab = () => {
    switch (activeTab) {
      case 'ledger': return <Ledger />;
      case 'radar': return <CreditSnapshot />;
      case 'ladder': return <CreditLadder />;
      case 'sims': return <BAHCalculator />;
      default: return <Ledger />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans pb-[env(safe-area-inset-bottom)]">
      
      <header className="px-6 pt-10 pb-6 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
          {activeTab === 'ledger' && 'Cash Flow'}
          {activeTab === 'radar' && '1% Radar'}
          {activeTab === 'ladder' && 'Deployment'}
          {activeTab === 'sims' && 'Simulators'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 max-w-2xl mx-auto w-full pb-32">
        {renderTab()}
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50 flex justify-around p-5 z-40 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button onClick={() => setActiveTab('ledger')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'ledger' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className="text-2xl leading-none">☰</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Ledger</span>
        </button>
        <button onClick={() => setActiveTab('radar')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'radar' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className="text-2xl leading-none">⌖</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Radar</span>
        </button>
        <button onClick={() => setActiveTab('ladder')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'ladder' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className="text-2xl leading-none">⎍</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Ladder</span>
        </button>
        <button onClick={() => setActiveTab('sims')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'sims' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className="text-2xl leading-none">◱</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Sims</span>
        </button>
      </nav>

    </div>
  );
}

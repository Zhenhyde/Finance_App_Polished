import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import Modal from './Modal';

export default function CreditSnapshot() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [balance, setBalance] = useState('');
  const [statementDate, setStatementDate] = useState('');

  const cards = useLiveQuery(() => db.credit_cards.toArray());

  const addCard = async (e) => {
    e.preventDefault();
    if (!name || !limit || !statementDate) return;
    await db.credit_cards.add({
      name,
      limit: parseFloat(limit),
      balance: parseFloat(balance || 0),
      statement_date: parseInt(statementDate)
    });
    setName(''); setLimit(''); setBalance(''); setStatementDate('');
    setIsModalOpen(false);
  };

  const deleteCard = async (id) => {
    await db.credit_cards.delete(id);
  };

  const getStatus = (stmtDay) => {
    const today = new Date();
    let stmtDate = new Date(today.getFullYear(), today.getMonth(), stmtDay);
    
    // If the statement day has passed this month, the next one is next month
    if (stmtDate < today && today.getDate() !== stmtDay) {
      stmtDate.setMonth(stmtDate.getMonth() + 1);
    }
    
    const diff = Math.ceil((stmtDate - today) / (1000 * 60 * 60 * 24));
    
    if (diff > 3) return { bg: 'bg-slate-800/50', text: 'text-slate-400', msg: 'Safe Zone' };
    if (diff > 1) return { bg: 'bg-amber-900/30 border border-amber-500/50', text: 'text-amber-400', msg: 'Paydown Imminent' };
    return { bg: 'bg-red-900/30 border border-red-500/50', text: 'text-red-400', msg: 'CRITICAL: Wire Funds Today' };
  };

  return (
    <div className="space-y-6">
      {!cards?.length && <p className="text-slate-500 text-sm bg-slate-900 p-6 rounded-3xl">No cards actively tracked.</p>}
      
      {cards?.map(card => {
        const status = getStatus(card.statement_date);
        const target1Percent = (card.limit * 0.01).toFixed(2);
        const paydownAmount = (card.balance - target1Percent).toFixed(2);
        
        return (
          <div key={card.id} className={`p-6 rounded-3xl flex flex-col justify-between shadow-lg ${status.bg}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-slate-100 tracking-tight">{card.name}</h3>
              <button onClick={() => deleteCard(card.id)} className="text-slate-500 hover:text-red-400 text-sm">✕</button>
            </div>
            <div className="text-sm space-y-2 text-slate-300">
              <p>Total Limit: <span className="font-medium text-slate-100">${card.limit}</span></p>
              <p>Current Balance: <span className="font-medium text-slate-100">${card.balance}</span></p>
              <p>Snapshot Day: <span className="font-medium text-slate-100">{card.statement_date}</span></p>
              <div className="pt-2 mt-2 border-t border-slate-700">
                <p className="font-semibold text-emerald-400 text-lg">Target 1%: ${target1Percent}</p>
              </div>
            </div>
            <div className={`mt-4 pt-4 font-bold ${status.text}`}>
              {status.msg} {paydownAmount > 0 && status.msg !== 'Safe Zone' ? `(Wire $${paydownAmount})` : ''}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center text-3xl font-light transition-transform active:scale-95 z-40"
      >
        +
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Track Credit Card">
        <form onSubmit={addCard} className="flex flex-col gap-4">
          <input type="text" placeholder="Card Name (e.g., Freedom Rise)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={name} onChange={e => setName(e.target.value)} />
          <input type="number" placeholder="Total Limit ($)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={limit} onChange={e => setLimit(e.target.value)} />
          <input type="number" placeholder="Current Balance ($)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={balance} onChange={e => setBalance(e.target.value)} />
          <input type="number" placeholder="Statement Close Day (1-31)" min="1" max="31" className="p-3 bg-slate-800 rounded-xl text-slate-400 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={statementDate} onChange={e => setStatementDate(e.target.value)} />
          <button type="submit" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl p-4 w-full transition-colors">Initialize Radar</button>
        </form>
      </Modal>
    </div>
  );
}

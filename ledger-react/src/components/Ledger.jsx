import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import Modal from './Modal';

export default function Ledger() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    await db.transactions.add({
      amount: parseFloat(amount),
      category,
      date
    });
    setAmount(''); setCategory(''); setDate('');
    setIsModalOpen(false);
  };

  const deleteTransaction = async (id) => {
    await db.transactions.delete(id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-400 mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {!transactions?.length && <p className="text-slate-500 text-sm">No transactions logged.</p>}
          {transactions?.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-100">{tx.category}</p>
                <p className="text-xs text-slate-400">{tx.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-emerald-400">${tx.amount.toFixed(2)}</p>
                <button onClick={() => deleteTransaction(tx.id)} className="text-slate-500 hover:text-red-400 text-sm">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center text-3xl font-light transition-transform active:scale-95 z-40"
      >
        +
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Transaction">
        <form onSubmit={addTransaction} className="flex flex-col gap-4">
          <input type="number" step="0.01" placeholder="Amount ($)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={amount} onChange={e => setAmount(e.target.value)} />
          <input type="text" placeholder="Category" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={category} onChange={e => setCategory(e.target.value)} />
          <input type="date" className="p-3 bg-slate-800 rounded-xl text-slate-400 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={date} onChange={e => setDate(e.target.value)} />
          <button type="submit" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl p-4 w-full transition-colors">Log Transaction</button>
        </form>
      </Modal>
    </div>
  );
}

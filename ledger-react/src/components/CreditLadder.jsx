import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import Modal from './Modal';

export default function CreditLadder() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const ladder = useLiveQuery(() => db.credit_ladder.orderBy('target_date').toArray());

  const addTarget = async (e) => {
    e.preventDefault();
    if (!name || !targetDate) return;
    await db.credit_ladder.add({
      name,
      target_date: targetDate,
      notes,
      status: 'pending'
    });
    setName(''); setTargetDate(''); setNotes('');
    setIsModalOpen(false);
  };

  const markAcquired = async (id, currentStatus) => {
    await db.credit_ladder.update(id, { status: currentStatus === 'pending' ? 'acquired' : 'pending' });
  };

  const deleteTarget = async (id) => {
    await db.credit_ladder.delete(id);
  };

  return (
    <div className="space-y-4">
      {!ladder?.length && <p className="text-slate-500 text-sm bg-slate-900 p-6 rounded-3xl">No targets set.</p>}

      {ladder?.map(item => {
        const isAcquired = item.status === 'acquired';
        const target = new Date(item.target_date);
        const today = new Date();
        // Zero out time for accurate day comparison
        target.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const isReady = today >= target && !isAcquired;

        return (
          <div key={item.id} className={`p-6 rounded-3xl flex flex-col gap-4 shadow-lg border-l-4 ${isAcquired ? 'bg-slate-900 border-slate-700' : isReady ? 'bg-emerald-900/10 border-emerald-500' : 'bg-slate-800/50 border-amber-500'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-bold text-xl tracking-tight ${isAcquired ? 'text-slate-600 line-through' : 'text-slate-100'}`}>{item.name}</h3>
                <p className="text-sm text-slate-400 mt-1">Target Date: {item.target_date}</p>
              </div>
              <button onClick={() => deleteTarget(item.id)} className="text-slate-600 hover:text-red-400 text-sm">✕</button>
            </div>
            
            <p className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded-xl">{item.notes}</p>
            
            <div className="flex justify-between items-center mt-2">
              {isReady ? <p className="text-xs font-black tracking-widest text-emerald-400">STATUS: CLEAR TO APPLY</p> : <div />}
              <button onClick={() => markAcquired(item.id, item.status)} className={`px-5 py-2.5 rounded-full font-bold text-xs tracking-wide transition-colors ${isAcquired ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'}`}>
                {isAcquired ? 'Revert' : 'Mark Acquired'}
              </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Deployment Target">
        <form onSubmit={addTarget} className="flex flex-col gap-4">
          <input type="text" placeholder="Target Card (e.g., Amex Gold)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={name} onChange={e => setName(e.target.value)} />
          <input type="date" className="p-3 bg-slate-800 rounded-xl text-slate-400 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          <input type="text" placeholder="Rules (e.g., Wait 90 days after Green)" className="p-3 bg-slate-800 rounded-xl text-slate-100 w-full outline-none focus:ring-2 focus:ring-emerald-500" value={notes} onChange={e => setNotes(e.target.value)} />
          <button type="submit" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl p-4 w-full transition-colors">Set Target</button>
        </form>
      </Modal>
    </div>
  );
}

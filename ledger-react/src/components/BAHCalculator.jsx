import React, { useState } from 'react';

export default function BAHCalculator() {
  const [bah, setBah] = useState('');
  const [rent, setRent] = useState('');
  const [utilities, setUtilities] = useState('');
  const [roommates, setRoommates] = useState(2);

  const totalCosts = parseFloat(rent || 0) + parseFloat(utilities || 0);
  const myShare = totalCosts / parseFloat(roommates || 1);
  const surplus = parseFloat(bah || 0) - myShare;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800/50 space-y-6">
      <div>
        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total BAH Allowance ($)</label>
        <input type="number" className="w-full p-4 mt-2 bg-slate-800 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" value={bah} onChange={e => setBah(e.target.value)} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Unit Rent ($)</label>
          <input type="number" className="w-full p-4 mt-2 bg-slate-800 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" value={rent} onChange={e => setRent(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Unit Utils ($)</label>
          <input type="number" className="w-full p-4 mt-2 bg-slate-800 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" value={utilities} onChange={e => setUtilities(e.target.value)} />
        </div>
      </div>
      
      <div>
        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Tenants (Split)</label>
        <input type="number" min="1" className="w-full p-4 mt-2 bg-slate-800 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" value={roommates} onChange={e => setRoommates(e.target.value)} />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-end">
        <div>
          <p className="text-sm text-slate-500 mb-1">Your Share</p>
          <p className="text-2xl font-medium text-slate-300">${myShare.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 mb-1">Tax-Free Surplus</p>
          <p className={`text-4xl font-black tracking-tight ${surplus > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${surplus.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import type { ComputedMonth, MonthData } from '../types';
import { fmt, n, uid } from '../utils';

interface Props {
  active: ComputedMonth;
  categories: string[];
  showCatMgr: boolean;
  showHelp: boolean;
  newCat: string;
  expenseQuery: string;
  expenseFilterCat: string;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
  onRequestSweep: () => void;
}

export default function ExpenseTracker({ active, categories, showCatMgr, showHelp, newCat, expenseQuery, expenseFilterCat, dispatch, onRequestSweep }: Props) {
  const budget = active.budget;
  const totalSpent = active.totalSpent;
  const expBalance = active.swept ? 0 : active.remaining;
  const pctUsed = budget > 0 ? Math.min(totalSpent / budget * 100, 100) : 0;
  const over = active.remaining < -0.005;
  const onTrack = !over;
  const pctBarColor = over ? 'var(--danger)' : pctUsed > 80 ? '#d29922' : 'var(--accent)';
  const expBalColor = expBalance < 0 ? 'var(--danger)' : 'var(--accent)';
  const sweptTag = active.swept ? ' · swept' : '';

  const [sortField, setSortField] = useState<'date' | 'desc' | 'category' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredExpenses = active.expenses.filter(e => {
    const qMatch = !expenseQuery || e.merchant.toLowerCase().includes(expenseQuery.toLowerCase());
    const cMatch = !expenseFilterCat || e.category === expenseFilterCat;
    return qMatch && cMatch;
  }).sort((a, b) => {
    let diff = 0;
    if (sortField === 'date') diff = a.date.localeCompare(b.date);
    else if (sortField === 'desc') diff = a.merchant.localeCompare(b.merchant);
    else if (sortField === 'category') diff = a.category.localeCompare(b.category);
    else if (sortField === 'amount') diff = n(a.amount) - n(b.amount);
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: 'date' | 'desc' | 'category' | 'amount') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field !== 'amount' && field !== 'date'); }
  };

  const updExp = (id: string, field: string, value: string | number) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({
        ...m,
        expenses: m.expenses.map(x => x.id === id ? { ...x, [field]: value } : x),
      }),
    } as never);

  const addExpense = () =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({
        ...m,
        expenses: [...m.expenses, { id: uid(), date: '', merchant: '', amount: 0, category: categories[0] || 'Other', cardId: undefined }],
      }),
    } as never);

  const removeExpense = (id: string) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({ ...m, expenses: m.expenses.filter(x => x.id !== id) }),
    } as never);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>3</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Expense Tracker</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="ghost-btn-sm" onClick={() => dispatch({ type: 'SET_SHOW_CAT_MGR', value: !showCatMgr } as never)}>
            {showCatMgr ? 'Hide Categories' : 'Categories'}
          </button>
          <button className="ghost-btn-sm" onClick={() => dispatch({ type: 'SET_SHOW_HELP', value: !showHelp } as never)}>
            {showHelp ? 'Hide Help' : 'Help'}
          </button>
        </div>
      </div>

      {showCatMgr && (
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Expense categories</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {categories.map(cn => (
              <span key={cn} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px 5px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--text-main)' }}>
                {cn}
                <button
                  onClick={() => dispatch({ type: 'REMOVE_CATEGORY', cat: cn } as never)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text" value={newCat} placeholder="New category name"
              onChange={e => dispatch({ type: 'SET_NEW_CAT', value: e.target.value } as never)}
              onKeyDown={e => e.key === 'Enter' && dispatch({ type: 'ADD_CATEGORY' } as never)}
              style={{ flex: 1, maxWidth: 260, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
            />
            <button className="green-btn-sm" onClick={() => dispatch({ type: 'ADD_CATEGORY' } as never)}>+ Add category</button>
          </div>
        </div>
      )}

      {showHelp && (
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}>Log each purchase in the table. Your <b style={{ color: 'var(--text-main)' }}>Expenses account</b> balance (Section 4) drops automatically as you spend — <b>Budget Remaining</b> is that live end amount.</div>
          <div><b style={{ color: 'var(--accent)' }}>Sweep</b> — at month's end, move whatever's left into a savings/investment account: pick the destination and hit <b>Apply</b>. Your Expenses account zeroes out and the leftover lands in the chosen account.</div>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Budget Remaining</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 24, fontWeight: 700, color: active.remaining < 0 ? 'var(--danger)' : 'var(--accent)' }}>{fmt(active.remaining)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>of {fmt(budget)} allocated{sweptTag}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Total Spent</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{fmt(totalSpent)}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>% of Budget Used</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: pctBarColor }}>{pctUsed.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text" value={expenseQuery} placeholder="Search description…"
          onChange={e => dispatch({ type: 'SET_EXPENSE_QUERY', value: e.target.value } as never)}
          style={{ flex: 1, minWidth: 180, maxWidth: 320, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '7px 11px', fontSize: 13 }}
        />
        <select
          value={expenseFilterCat}
          onChange={e => dispatch({ type: 'SET_EXPENSE_FILTER_CAT', value: e.target.value } as never)}
          style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '7px 9px', fontSize: 12 }}
        >
          <option value="">All categories</option>
          {categories.map(cn => <option key={cn} value={cn}>{cn}</option>)}
        </select>
        {(expenseQuery || expenseFilterCat) && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }}>showing {filteredExpenses.length} of {active.expenses.length}</span>
        )}
      </div>

      {/* Expense table */}
      <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th onClick={() => toggleSort('date')} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: 120, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Date {sortField === 'date' ? (sortAsc ? '▲' : '▼') : <span style={{opacity: 0.3}}>▼</span>}</div>
              </th>
              <th onClick={() => toggleSort('desc')} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: 'auto', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Merchant {sortField === 'desc' ? (sortAsc ? '▲' : '▼') : <span style={{opacity: 0.3}}>▼</span>}</div>
              </th>
              <th onClick={() => toggleSort('category')} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: 140, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Category {sortField === 'category' ? (sortAsc ? '▲' : '▼') : <span style={{opacity: 0.3}}>▼</span>}</div>
              </th>
              <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: 140 }}>
                Payment Method
              </th>
              <th onClick={() => toggleSort('amount')} style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: 100, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>Amount {sortField === 'amount' ? (sortAsc ? '▲' : '▼') : <span style={{opacity: 0.3}}>▼</span>}</div>
              </th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
          {filteredExpenses.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '5px 8px 5px 0' }}>
                <input type="date" value={e.date} onChange={ev => updExp(e.id, 'date', ev.target.value)}
                  style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 12 }} />
              </td>
              <td style={{ padding: '5px 8px' }}>
                <input type="text" value={e.merchant} placeholder="Where / What?" onChange={ev => updExp(e.id, 'merchant', ev.target.value)}
                  style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
              </td>
              <td style={{ padding: '5px 8px' }}>
                <select value={e.category} onChange={ev => updExp(e.id, 'category', ev.target.value)}
                  style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                  {categories.map(cn => <option key={cn} value={cn}>{cn}</option>)}
                </select>
              </td>
              <td style={{ padding: '5px 8px' }}>
                <select value={e.cardId || ''} onChange={ev => updExp(e.id, 'cardId', ev.target.value)}
                  style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                  <option value="">Checking/Cash</option>
                  {active.creditCards?.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                </select>
              </td>
              <td style={{ padding: '5px 8px' }}>
                <input type="number" step="0.01" value={e.amount} onChange={ev => updExp(e.id, 'amount', n(ev.target.value))} onFocus={ev => ev.target.select()}
                  style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 13, textAlign: 'right' }} />
              </td>
              <td style={{ padding: '5px 0 5px 4px', textAlign: 'center' }}>
                <button onClick={() => removeExpense(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: 4 }}
                  onMouseEnter={ev => (ev.currentTarget.style.color = 'var(--danger)')} onMouseLeave={ev => (ev.currentTarget.style.color = 'var(--text-muted)')}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <button className="dashed-btn" onClick={addExpense} style={{ marginTop: 12 }}>+ Add expense</button>

      {/* Summary + sweep */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Spent</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 14 }}>{fmt(totalSpent)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Remaining</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 14, color: expBalColor }}>{fmt(active.remaining)}</span>
          </div>
          <div style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>% of budget used</span>
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: pctBarColor }}>{pctUsed.toFixed(1)}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-main)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(pctUsed, 100)}%`, background: pctBarColor, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {over && <div style={{ padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>Over budget!</div>}
          {onTrack && !over && <div style={{ padding: '12px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 8, color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>✓ On track</div>}

          <div style={{ padding: '12px 14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Leftover to sweep</div>
                <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{fmt(active.leftover)}</div>
              </div>
              {active.swept && <span style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 10px' }}>Swept ✓</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
              <select
                value={active.sweepTarget}
                onChange={e => dispatch({ type: 'UPDATE_MONTH', id: active.id, updater: (m: MonthData) => ({ ...m, sweepTarget: e.target.value }) } as never)}
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
              >
                {active.accounts.filter(a => a.name !== active.expAcctName).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
              <button className="green-btn-sm" onClick={onRequestSweep}>Apply</button>
              {active.swept && (
                <button className="ghost-btn-sm" onClick={() => dispatch({ type: 'UPDATE_MONTH', id: active.id, updater: (m: MonthData) => ({ ...m, swept: false }) } as never)}>Undo</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

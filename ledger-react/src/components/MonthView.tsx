import React from 'react';
import type { ComputedMonth, AppState, MonthData } from '../types';
import IncomeSection from './IncomeSection';
import AllocationsSection from './AllocationsSection';
import ExpenseTracker from './ExpenseTracker';
import AccountsSection from './AccountsSection';
import CreditCardsSection from './CreditCardsSection';
import { fmt, MONTHS } from '../utils';

interface Props {
  state: AppState;
  active: ComputedMonth;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
  onRequestPush: () => void;
  onRequestSweep: () => void;
  onDeleteMonth: (id: string) => void;
  isFirst: boolean;
}

export default function MonthView({ state, active, dispatch, onRequestPush, onRequestSweep, onDeleteMonth, isFirst }: Props) {
  const yearsList = [];
  for(let y = active.year - 5; y <= active.year + 5; y++) yearsList.push(y);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>Month Nickname & Date</span>
            {!isFirst && (
              <button className="ghost-btn-sm" onClick={() => dispatch({ type: 'MIRROR_PREVIOUS_ALLOCATIONS', id: active.id } as never)}>
                Mirror Previous Allocations
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text" value={active.label}
              onChange={e => dispatch({ type: 'UPDATE_MONTH', id: active.id, updater: (m: import('../types').MonthData) => ({ ...m, label: e.target.value }) } as never)}
              placeholder="e.g. Vacation Month"
              style={{ fontSize: 26, fontWeight: 700, fontFamily: "'IBM Plex Sans'", background: 'transparent', border: 'none', color: 'var(--text-main)', borderBottom: '2px dotted var(--border)', outline: 'none', width: 220 }}
            />
            <span style={{ fontSize: 26, color: 'var(--text-muted)' }}>|</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={active.monthIndex}
                onChange={e => dispatch({ type: 'UPDATE_MONTH_DATE', id: active.id, monthIndex: parseInt(e.target.value, 10), year: active.year } as never)}
                style={{ fontSize: 24, fontWeight: 700, fontFamily: "'IBM Plex Sans'", background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 32px 4px 12px', color: 'var(--text-main)', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237d8896%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '10px auto' }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={active.year}
                onChange={e => dispatch({ type: 'UPDATE_MONTH_DATE', id: active.id, monthIndex: active.monthIndex, year: parseInt(e.target.value, 10) } as never)}
                style={{ fontSize: 24, fontWeight: 700, fontFamily: "'IBM Plex Sans'", background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 32px 4px 12px', color: 'var(--text-main)', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237d8896%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '10px auto' }}
              >
                {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Move this month to the Recycle Bin?")) {
                  onDeleteMonth(active.id);
                }
              }}
              style={{ 
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--danger)', 
                borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', marginLeft: 16 
              }}
              title="Move to Recycle Bin"
            >
              Move to Trash
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Take-Home</div>
            <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "'IBM Plex Mono'", color: 'var(--accent)' }}>{fmt(active.takeHome)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Net Worth</div>
            <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "'IBM Plex Mono'", color: 'var(--text-main)' }}>{fmt(active.netWorth)}</div>
          </div>
        </div>
      </div>

      {isFirst && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--accent)' }}>
          First month — enter your real starting account balances below. Every later month carries these forward by name.
        </div>
      )}

      {/* Sections 1 & 2 side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <IncomeSection active={active} activeId={active.id} dispatch={dispatch} onDeleteMonth={onDeleteMonth} />
        <AllocationsSection active={active} dispatch={dispatch} onRequestPush={onRequestPush} />
      </div>

      {/* Section 3 */}
      <ExpenseTracker
        active={active}
        categories={state.categories}
        showCatMgr={state.showCatMgr}
        showHelp={state.showHelp}
        newCat={state.newCat}
        expenseQuery={state.expenseQuery}
        expenseFilterCat={state.expenseFilterCat}
        dispatch={dispatch}
        onRequestSweep={onRequestSweep}
      />

      {/* Section 4 */}
      <AccountsSection active={active} dragId={state.dragId} dispatch={dispatch} />

      {/* Section 5 (Credit Cards) */}
      <div style={{ marginTop: 20 }}>
        <CreditCardsSection active={active} dispatch={dispatch} />
      </div>

      {/* Notes */}
      <div className="section-card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: "'IBM Plex Mono'" }}>✎</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Notes for this month</h3>
        </div>
        <textarea
          value={active.notes}
          onChange={e => dispatch({ type: 'UPDATE_MONTH', id: active.id, updater: (m: MonthData) => ({ ...m, notes: e.target.value }) } as never)}
          placeholder="Context that should travel with this month — e.g. used a vacation day, one-off car repair, spent more on food…"
          style={{ width: '100%', minHeight: 80, resize: 'vertical', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 8, padding: '12px 14px', fontFamily: "'IBM Plex Sans'", fontSize: 13, lineHeight: 1.6 }}
        />
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}

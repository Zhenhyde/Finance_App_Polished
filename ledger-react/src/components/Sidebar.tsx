import React from 'react';
import type { AppState, MonthData } from '../types';
import { computeMonths, fmt } from '../utils';

interface SidebarProps {
  state: AppState;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
  computedMonths: ReturnType<typeof computeMonths>;
  onAddMonth: () => void;
}

export default function Sidebar({ state, dispatch, computedMonths, onAddMonth }: SidebarProps) {
  const isDashboard = state.view === 'dashboard';
  const activeId = state.activeMonthId;
  const maxY = state.months.length > 0 ? Math.max(...state.months.map(m => m.year)) : new Date().getFullYear();
  const activeMonth = state.months.find(m => m.id === activeId) || state.months[state.months.length - 1];
  const activeYear = activeMonth ? activeMonth.year : new Date().getFullYear();

  const byYear: Record<number, MonthData[]> = {};
  state.months.forEach(m => { (byYear[m.year] = byYear[m.year] || []).push(m); });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const cmMap: Record<string, ReturnType<typeof computeMonths>[0]> = {};
  computedMonths.forEach(m => { cmMap[m.id] = m; });

  return (
    <aside style={{ width: 256, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', padding: '20px 14px', overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 18px' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-hover), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'var(--bg-main)' }}>L</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.3px' }}>LEDGER</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Command Center</div>
        </div>
      </div>

      {/* Dashboard btn */}
      <button
        onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' } as never)}
        className="sidebar-btn"
        style={{ background: isDashboard ? 'var(--accent-bg)' : 'transparent', color: isDashboard ? 'var(--accent)' : 'var(--text-main)', marginBottom: 6 }}
      >
        <span style={{ fontSize: 15 }}>▦</span> Dashboard
      </button>

      {/* Trash btn */}
      <button
        onClick={() => dispatch({ type: 'SET_VIEW', view: 'trash' } as never)}
        className="sidebar-btn"
        style={{ background: state.view === 'trash' ? 'var(--accent-bg)' : 'transparent', color: state.view === 'trash' ? 'var(--accent)' : 'var(--text-main)', marginBottom: 6 }}
      >
        <span style={{ fontSize: 15 }}>🗑️</span> Recycle Bin ({state.trash?.length || 0})
      </button>

      {/* Settings btn */}
      <button
        onClick={() => dispatch({ type: 'SET_VIEW', view: 'settings' } as never)}
        className="sidebar-btn"
        style={{ background: state.view === 'settings' ? 'var(--accent-bg)' : 'transparent', color: state.view === 'settings' ? 'var(--accent)' : 'var(--text-main)', marginBottom: 6 }}
      >
        <span style={{ fontSize: 15 }}>⚙️</span> Global Settings
      </button>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '14px 12px 8px', fontWeight: 600 }}>Months by year</div>

      {years.map(yr => {
        const ov = state.yearsOpen[yr];
        const open = ov === undefined ? (yr === maxY || yr === activeYear) : ov;
        return (
          <div key={yr} style={{ marginBottom: 4 }}>
            <button
              className="sidebar-btn"
              onClick={() => dispatch({ type: 'TOGGLE_YEAR', year: yr } as never)}
              style={{ background: 'transparent', color: 'var(--text-main)', gap: 8 }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 10 }}>{open ? '▾' : '▸'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>{yr}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--bg-main)', borderRadius: 10, padding: '2px 8px' }}>{byYear[yr].length}</span>
            </button>
            {open && (
              <div style={{ paddingLeft: 8 }}>
                {byYear[yr].map(m => {
                  const cm = cmMap[m.id];
                  const on = m.id === activeId && !isDashboard;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <button
                        className="month-btn"
                        onClick={() => dispatch({ type: 'SELECT_MONTH', id: m.id } as never)}
                        style={{ borderLeft: `2px solid ${on ? 'var(--accent)' : 'transparent'}`, background: on ? 'var(--accent-bg)' : 'transparent', color: on ? 'var(--text-main)' : 'var(--text-muted)' }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
                        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono'", color: 'var(--text-muted)', flexShrink: 0 }}>{cm ? fmt(cm.takeHome) : ''}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button className="add-month-btn" onClick={onAddMonth}>+ Add Month</button>
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 12, fontWeight: 600 }}>Theme</div>
        <select
          style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
          value={state.theme}
          onChange={e => dispatch({ type: 'SET_THEME', theme: e.target.value as AppState['theme'] })}
        >
          <option value="classic-dark">Classic Dark</option>
          <option value="emerald-dark">Emerald Dark</option>
          <option value="slate-light">Slate Light</option>
          <option value="warm-light">Warm Light</option>
        </select>
      </div>
      <div style={{ marginTop: 16, padding: '0 10px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Grouped chronologically. Finished years collapse.
      </div>
    </aside>
  );
}

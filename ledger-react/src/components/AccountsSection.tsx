import React from 'react';
import type { ComputedMonth, MonthData } from '../types';
import { fmt, n, uid } from '../utils';

interface Props {
  active: ComputedMonth;
  dragId: string | null;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
}

export default function AccountsSection({ active, dragId, dispatch }: Props) {
  const accounts = active.accounts;
  const placed = active.placed;
  const th = active.takeHome;
  const placedValid = Math.abs(active.unplaced) < 0.005;
  const checkBg = placedValid ? 'var(--accent-bg)' : 'var(--danger-bg)';
  const checkBorder = placedValid ? 'var(--accent)' : 'var(--danger)';
  const checkColor = placedValid ? 'var(--accent)' : 'var(--danger)';
  const checkText = placedValid ? '✓ Fully reconciled' : `Unplaced: ${fmt(active.unplaced)}`;

  const addAccount = () =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({
        ...m, accounts: [...m.accounts, { id: uid(), name: 'New Account', bank: '', type: 'Savings', fundedBy: 'Take-home', start: 0, contribution: 0 }],
      }),
    } as never);

  const updAcc = (id: string, field: string, value: string | number) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({
        ...m, accounts: m.accounts.map(x => x.id === id ? { ...x, [field]: value } : x),
      }),
    } as never);

  const removeAcc = (id: string) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({ ...m, accounts: m.accounts.filter(x => x.id !== id) }),
    } as never);

  const onDragStart = (e: React.DragEvent, id: string) => {
    dispatch({ type: 'SET_DRAG_ID', id } as never);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDragEnd = () => dispatch({ type: 'SET_DRAG_ID', id: null } as never);
  const onDrop = (e: React.DragEvent, toId: string) => {
    e.preventDefault();
    const fromId = dragId;
    dispatch({ type: 'SET_DRAG_ID', id: null } as never);
    if (!fromId || fromId === toId) return;
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const arr = [...m.accounts];
        const fi = arr.findIndex(a => a.id === fromId);
        const ti = arr.findIndex(a => a.id === toId);
        if (fi < 0 || ti < 0) return m;
        const [moved] = arr.splice(fi, 1);
        arr.splice(ti, 0, moved);
        return { ...m, accounts: arr };
      },
    } as never);
  };

  // transfers
  const addTransfer = () =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const names = m.accounts.map(a => a.name);
        return { ...m, transfers: [...(m.transfers || []), { id: uid(), from: names[0] || '', to: names[1] || names[0] || '', amount: 0 }] };
      },
    } as never);

  const updTransfer = (id: string, field: string, value: string | number) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({
        ...m, transfers: (m.transfers || []).map(t => t.id === id ? { ...t, [field]: value } : t),
      }),
    } as never);

  const removeTransfer = (id: string) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => ({ ...m, transfers: (m.transfers || []).filter(t => t.id !== id) }),
    } as never);

  const accountNames = accounts.map(a => a.name);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>4</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Account Balances</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>drag to reorder</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['','Account','Bank','Type','Funded By','Start','Contribution','End',''].map((h, i) => (
              <th key={i} style={{ textAlign: i >= 5 && i <= 7 ? 'right' : 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 6px 8px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {accounts.map(acc => (
            <tr
              key={acc.id}
              draggable
              onDragStart={e => onDragStart(e, acc.id)}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={e => onDrop(e, acc.id)}
              style={{ borderBottom: '1px solid var(--border)', opacity: dragId === acc.id ? 0.4 : 1, cursor: 'grab' }}
            >
              <td style={{ padding: '4px 6px', color: 'var(--text-muted)', fontSize: 14 }}>⠿</td>
              <td style={{ padding: '4px 6px' }}>
                <input type="text" value={acc.name} onChange={e => updAcc(acc.id, 'name', e.target.value)}
                  style={{ width: 140, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 8px', fontSize: 12 }} />
              </td>
              <td style={{ padding: '4px 6px' }}>
                <input type="text" value={acc.bank} onChange={e => updAcc(acc.id, 'bank', e.target.value)}
                  style={{ width: 80, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 8px', fontSize: 12 }} />
              </td>
              <td style={{ padding: '4px 6px' }}>
                <select value={acc.type} onChange={e => updAcc(acc.id, 'type', e.target.value)}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 6px', fontSize: 12 }}>
                  {['Checking','Savings','Investment','Retirement'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td style={{ padding: '4px 6px' }}>
                <select value={acc.fundedBy} onChange={e => updAcc(acc.id, 'fundedBy', e.target.value)}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 6px', fontSize: 12 }}>
                  {['Take-home','Payroll','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                {acc.startEditable
                  ? <input type="number" step="0.01" value={acc.start} onChange={e => updAcc(acc.id, 'start', n(e.target.value))} onFocus={ev => ev.target.select()}
                      style={{ width: 96, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }} />
                  : <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: 'var(--text-muted)', paddingRight: 8 }}>{acc.startF}</span>
                }
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                {acc.auto
                  ? <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: 8 }}>auto</span>
                  : <input type="number" step="0.01" value={acc.contribution} onChange={e => updAcc(acc.id, 'contribution', n(e.target.value))} onFocus={ev => ev.target.select()}
                      className="field-input-accent" style={{ width: 96 }} />
                }
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, color: acc.end >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>{acc.endF}</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => removeAcc(acc.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="dashed-btn" onClick={addAccount} style={{ marginTop: 10 }}>+ Add account</button>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
        <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Total Assets</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{fmt(active.totalAssets)}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Take-Home</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: 'var(--text-main)' }}>{fmt(th)}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Placed (from take-home)</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: 'var(--text-main)' }}>{fmt(placed)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 8, background: checkBg, border: `1px solid ${checkBorder}` }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Reconciliation</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: checkColor }}>{checkText}</div>
          </div>
        </div>
      </div>

      {/* Transfers */}
      {(active.transfers && active.transfers.length > 0) && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>Mid-month transfers</div>
          {active.transfers.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <select value={t.from} onChange={e => updTransfer(t.id, 'from', e.target.value)}
                style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                {accountNames.map(an => <option key={an} value={an}>{an}</option>)}
              </select>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <select value={t.to} onChange={e => updTransfer(t.id, 'to', e.target.value)}
                style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                {accountNames.map(an => <option key={an} value={an}>{an}</option>)}
              </select>
              <input type="number" step="0.01" value={t.amount} onChange={e => updTransfer(t.id, 'amount', n(e.target.value))} onFocus={ev => ev.target.select()}
                style={{ width: 100, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }} />
              <button onClick={() => removeTransfer(t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>×</button>
            </div>
          ))}
        </div>
      )}
      <button className="ghost-btn-sm" onClick={addTransfer} style={{ marginTop: 10 }}>+ Add transfer</button>
    </div>
  );
}

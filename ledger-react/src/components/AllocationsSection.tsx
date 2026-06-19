import React from 'react';
import type { ComputedMonth, AllocTarget, MonthData } from '../types';
import { fmt, n, BUCKETS } from '../utils';

interface Props {
  active: ComputedMonth;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
  onRequestPush: () => void;
}

export default function AllocationsSection({ active, dispatch, onRequestPush }: Props) {
  const allocs = active.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
  const allocSum = BUCKETS.reduce((s, [k]) => s + n((allocs[k] || {}).pct), 0);
  const allocValid = Math.abs(allocSum - 100) < 0.001;
  const allocInvalid = !allocValid;

  const uid = () => 'i' + Math.random().toString(36).slice(2, 8);

  const updAlloc = (k: string, pct: number) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const al = { ...(m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>) };
        al[k] = { ...al[k], pct };
        return { ...m, allocations: al as MonthData['allocations'], pushed: false };
      },
    } as never);

  const updTarget = (k: string, id: string, field: string, value: string | number) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const al = { ...(m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>) };
        al[k] = { ...al[k], targets: al[k].targets.map(t => t.id === id ? { ...t, [field]: value } : t) };
        return { ...m, allocations: al as MonthData['allocations'], pushed: false };
      },
    } as never);

  const addTarget = (k: string) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const al = { ...(m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>) };
        const firstName = (m.accounts[0] || {}).name || '';
        al[k] = { ...al[k], targets: [...al[k].targets, { id: uid(), accountName: firstName, pct: 0 }] };
        return { ...m, allocations: al as MonthData['allocations'], pushed: false };
      },
    } as never);

  const removeTarget = (k: string, id: string) =>
    dispatch({
      type: 'UPDATE_MONTH', id: active.id,
      updater: (m: MonthData) => {
        const al = { ...(m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>) };
        al[k] = { ...al[k], targets: al[k].targets.filter(t => t.id !== id) };
        return { ...m, allocations: al as MonthData['allocations'], pushed: false };
      },
    } as never);

  const accountNames = active.accounts.map(a => a.name);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>2</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Budget Allocations</h3>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 34 }}>
        Set each bucket's % of take-home, then split it across specific accounts. Splits within a bucket total 100%.
      </div>

      {BUCKETS.map(([key, label]) => {
        const b = allocs[key] || { pct: 0, targets: [] };
        const bp = n(b.pct);
        const bd = bp / 100 * active.takeHome;
        const subSum = (b.targets || []).reduce((s, t) => s + n(t.pct), 0);
        const subInvalid = b.targets.length > 0 && Math.abs(subSum - 100) > 0.01;

        return (
          <div key={key} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{label}</div>
              <input
                type="number" step="1" value={bp}
                onChange={e => updAlloc(key, n(e.target.value))}
                onFocus={e => e.target.select()}
                style={{ width: 54, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 13, textAlign: 'right' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 13, width: 10 }}>%</span>
              <span style={{ width: 88, textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{fmt(bd)}</span>
            </div>

            {(b.targets || []).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0 5px 14px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>↳</span>
                <select
                  value={t.accountName}
                  onChange={e => updTarget(key, t.id, 'accountName', e.target.value)}
                  style={{ flex: 1, minWidth: 0, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 8px', fontSize: 12 }}
                >
                  {accountNames.map(an => <option key={an} value={an}>{an}</option>)}
                </select>
                <input
                  type="number" step="1" value={t.pct}
                  onChange={e => updTarget(key, t.id, 'pct', n(e.target.value))}
                  onFocus={e => e.target.select()}
                  style={{ width: 48, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '5px 6px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 8 }}>%</span>
                <span style={{ width: 80, textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontSize: 12, color: 'var(--text-muted)' }}>{fmt(bd * n(t.pct) / 100)}</span>
                <button
                  onClick={() => removeTarget(key, t.id)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >×</button>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 14, marginTop: 4 }}>
              <button
                onClick={() => addTarget(key)}
                style={{ border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, padding: '2px 0' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >+ split to another account</button>
              {subInvalid && <span style={{ color: 'var(--danger)', fontSize: 11 }}>splits = {Math.round(subSum)}% (should be 100%)</span>}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 14 }}>
        {allocValid && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
            <span>✓ Buckets total 100% of take-home</span>
            <span style={{ fontFamily: "'IBM Plex Mono'" }}>{Math.round(allocSum)}%</span>
          </div>
        )}
        {allocInvalid && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
            <span>Buckets must total 100%</span>
            <span style={{ fontFamily: "'IBM Plex Mono'" }}>{Math.round(allocSum)}%</span>
          </div>
        )}
      </div>

      <button
        onClick={onRequestPush}
        className="ghost-btn"
        style={{ marginTop: 12 }}
      >↻ Push these allocations into account contributions</button>
    </div>
  );
}

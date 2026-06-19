import React from 'react';
import type { ComputedCreditCard, ComputedMonth } from '../types';
import { fmt } from '../utils';

interface Props {
  active: ComputedMonth;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
}

export default function CreditCardsSection({ active, dispatch }: Props) {
  const updCard = (id: string, field: string, v: string | number) => {
    dispatch({
      type: 'UPDATE_MONTH', id: active.id, updater: (m: import('../types').MonthData) => {
        const creditCards = m.creditCards.map(cc => cc.id === id ? { ...cc, [field]: v } : cc);
        return { ...m, creditCards };
      }
    } as never);
  };

  const addCard = () => {
    dispatch({
      type: 'UPDATE_MONTH', id: active.id, updater: (m: import('../types').MonthData) => {
        const id = 'cc' + Math.random().toString(36).slice(2, 8);
        const creditCards = [...(m.creditCards || []), { id, name: 'New Card', limit: 5000, startBalance: 0, payment: 0 }];
        return { ...m, creditCards };
      }
    } as never);
  };

  const removeCard = (id: string) => {
    if (confirm("Remove this credit card? Note: any expenses tagged to this card will lose their association.")) {
      dispatch({
        type: 'UPDATE_MONTH', id: active.id, updater: (m: import('../types').MonthData) => {
          const creditCards = m.creditCards.filter(cc => cc.id !== id);
          const expenses = m.expenses.map(e => e.cardId === id ? { ...e, cardId: undefined } : e);
          return { ...m, creditCards, expenses };
        }
      } as never);
    }
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Credit Cards (Debt)</h3>
        <button className="dashed-btn-sm" onClick={addCard}>+ Add card</button>
      </div>

      {(!active.creditCards || active.creditCards.length === 0) && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>No credit cards added.</div>
      )}

      {active.creditCards?.map((cc: ComputedCreditCard) => (
        <div key={cc.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <input 
              type="text" 
              value={cc.name} 
              onChange={e => updCard(cc.id, 'name', e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 14, fontWeight: 600, outline: 'none', padding: 0 }}
            />
            <button onClick={() => removeCard(cc.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Credit Utilization</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--text-muted)' }}>{cc.utilizationPct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(cc.utilizationPct, 100)}%`, background: cc.utilizationPct > 30 ? 'var(--danger)' : 'var(--accent)', borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ width: 100, marginLeft: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Limit</div>
              <input
                type="number" step="100" value={cc.limit}
                onChange={e => updCard(cc.id, 'limit', e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 4, padding: '4px 6px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }}
              />
            </div>
          </div>

          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 8 }}>Start Balance</td>
                <td style={{ textAlign: 'right', paddingBottom: 8 }}>
                  {cc.startEditable ? (
                    <input
                      type="number" step="0.01" value={cc.startBalance}
                      onChange={e => updCard(cc.id, 'startBalance', e.target.value)}
                      style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--danger)', borderRadius: 4, padding: '4px 6px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }}
                    />
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono'", color: 'var(--danger)' }}>{fmt(cc.start)}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 8 }}>New Charges (Expenses)</td>
                <td style={{ textAlign: 'right', paddingBottom: 8, fontFamily: "'IBM Plex Mono'", color: 'var(--danger)' }}>+{fmt(cc.newCharges)}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 8 }}>Payment (from Take-Home)</td>
                <td style={{ textAlign: 'right', paddingBottom: 8 }}>
                  <input
                    type="number" step="0.01" value={cc.payment}
                    onChange={e => updCard(cc.id, 'payment', e.target.value)}
                    style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 4, padding: '4px 6px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }}
                  />
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ color: 'var(--text-main)', fontWeight: 600, paddingTop: 8 }}>End Balance</td>
                <td style={{ textAlign: 'right', paddingTop: 8, fontFamily: "'IBM Plex Mono'", color: cc.end > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>{fmt(cc.end)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      
      {active.creditCards && active.creditCards.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-hover)', borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>Total Credit Card Debt</span>
          <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 600, color: 'var(--danger)' }}>{fmt(active.totalDebt)}</span>
        </div>
      )}
    </div>
  );
}

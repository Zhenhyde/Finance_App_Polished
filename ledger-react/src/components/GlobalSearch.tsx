import { useState, useEffect, useRef } from 'react';
import type { MonthData } from '../types';
import { fmt } from '../utils';

interface Props {
  months: MonthData[];
  onClose: () => void;
  onNavigateToMonth: (id: string) => void;
}

export function GlobalSearch({ months, onClose, onNavigateToMonth }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const allExpenses = months.flatMap(m => 
    m.expenses.map(e => ({ ...e, monthId: m.id, monthLabel: m.label }))
  );

  const results = allExpenses.filter(e => 
    e.merchant.toLowerCase().includes(query.toLowerCase()) || 
    e.category.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da; // sort newest first
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000,
      paddingTop: '10vh'
    }}>
      <div style={{
        backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', width: '600px', maxWidth: '90%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', marginRight: '12px', opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all transactions (Cmd+K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', outline: 'none' }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>Esc</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {query.trim() === '' ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Type to search across all months...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions found for "{query}"
            </div>
          ) : (
            <div>
              {results.map(e => (
                <div 
                  key={e.id}
                  onClick={() => {
                    onNavigateToMonth(e.monthId);
                    onClose();
                  }}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', transition: 'background 0.1s'
                  }}
                  onMouseEnter={ev => ev.currentTarget.style.backgroundColor = 'var(--accent-bg)'}
                  onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{e.merchant || 'Untitled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent)' }}>{e.monthLabel}</span> • {e.date} • {e.category}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: 'var(--text)' }}>
                    {fmt(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

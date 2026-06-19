import type { MonthData } from '../types';
import { fmt, n } from '../utils';

interface Props {
  trash: MonthData[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onClose: () => void;
}

export function TrashView({ trash, onRestore, onPermanentDelete, onEmptyTrash, onClose }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Recycle Bin</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>Deleted months are stored here. You can restore them or delete them permanently.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {trash.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to permanently delete ALL items in the trash? This cannot be undone.")) {
                  onEmptyTrash();
                }
              }}
              style={{ padding: '8px 16px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Empty Trash
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {trash.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🗑️</div>
            <p>The recycle bin is empty.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {trash.map(m => {
              const th = n(m.income.basePay) + n((m.income as any).specialPays || 0); // rough estimate for display
              return (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{m.label}</h3>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Total Expenses: {m.expenses.length} | Gross Income: {fmt(th)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => onRestore(m.id)}
                      style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Permanently delete ${m.label}?`)) {
                          onPermanentDelete(m.id);
                        }
                      }}
                      style={{ padding: '6px 12px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

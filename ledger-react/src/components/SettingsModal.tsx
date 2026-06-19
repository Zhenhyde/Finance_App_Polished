import { useState } from 'react';
import type { GlobalSettings, RecurringExpense } from '../types';
import { uid } from '../utils';

interface Props {
  settings: GlobalSettings;
  categories: string[];
  onSave: (settings: Partial<GlobalSettings>) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, categories, onSave, onClose }: Props) {
  const [fica, setFica] = useState(settings.ficaRate.toString());
  const [recurring, setRecurring] = useState<RecurringExpense[]>(settings.recurringExpenses || []);
  const [leaveDate, setLeaveDate] = useState(settings.leaveStartDate || new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    const val = parseFloat(fica);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      onSave({ ficaRate: val, recurringExpenses: recurring, leaveStartDate: leaveDate });
      onClose();
    } else {
      alert("Please enter a valid percentage for FICA (0 - 100).");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', width: '550px', maxWidth: '90%'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Global Settings</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            FICA Tax Deduction Rate (%)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="number" 
              step="0.01"
              value={fica} 
              onChange={e => setFica(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', flex: 1
              }}
            />
            <span>%</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            This applies globally to all months to accurately calculate your base take-home pay. Default is 7.65%.
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Military Start Date (For Leave Tracker)
          </label>
          <input 
            type="date" 
            value={leaveDate} 
            onChange={e => setLeaveDate(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', width: '100%', outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Recurring Expenses</label>
            <button 
              onClick={() => setRecurring([...recurring, { id: uid(), dayOfMonth: 1, desc: 'New Expense', amount: 0, category: 'Other' }])}
              style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recurring.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No recurring expenses.</div>
            )}
            {recurring.map(r => (
              <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <input 
                  type="number" 
                  value={r.dayOfMonth} 
                  onChange={e => setRecurring(recurring.map(x => x.id === r.id ? { ...x, dayOfMonth: parseInt(e.target.value) || 1 } : x))}
                  style={{ width: '40px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}
                  title="Day of Month"
                />
                <input 
                  type="text" 
                  value={r.desc} 
                  onChange={e => setRecurring(recurring.map(x => x.id === r.id ? { ...x, desc: e.target.value } : x))}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                  placeholder="Description"
                />
                <select 
                  value={r.category} 
                  onChange={e => setRecurring(recurring.map(x => x.id === r.id ? { ...x, category: e.target.value } : x))}
                  style={{ width: '120px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  type="number" 
                  step="0.01"
                  value={r.amount} 
                  onChange={e => setRecurring(recurring.map(x => x.id === r.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))}
                  style={{ width: '70px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
                  placeholder="Amount"
                />
                <button 
                  onClick={() => setRecurring(recurring.filter(x => x.id !== r.id))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', fontSize: '14px' }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            These expenses will be automatically injected whenever you add a new month.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

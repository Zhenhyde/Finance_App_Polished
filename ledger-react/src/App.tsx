import { useEffect, useState } from 'react';
import { useAppState } from './store';
import { computeMonths, MONTHS } from './utils';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import Dashboard from './components/Dashboard';
import PreviewModal from './components/PreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TrashView } from './components/TrashView';
import { GlobalSearch } from './components/GlobalSearch';

export default function App() {
  const { state, dispatch, requestPush, requestSweep, deleteMonth, exportCSV } = useAppState();
  const months = computeMonths(state);
  const active = months.find(m => m.id === state.activeMonthId) || months[months.length - 1];
  const isFirst = state.months.findIndex(m => m.id === active?.id) === 0;

  const [showSearch, setShowSearch] = useState(false);
  const [firstMonthIndex, setFirstMonthIndex] = useState(new Date().getMonth());
  const [firstYear, setFirstYear] = useState(new Date().getFullYear());

  useEffect(() => {
    document.body.className = state.theme === 'classic-dark' ? '' : `theme-${state.theme}`;
  }, [state.theme]);

  const backupJSON = () => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ledger-backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Cmd+S or Ctrl+S for backup
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        backupJSON();
      }
      // Cmd+D or Ctrl+D for Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', view: 'dashboard' } as never);
      }
      // Cmd+ArrowLeft/Right for month switching
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const sorted = [...state.months].sort((a, b) => (a.year * 12 + a.monthIndex) - (b.year * 12 + b.monthIndex));
        const idx = sorted.findIndex(m => m.id === state.activeMonthId);
        if (idx !== -1) {
          if (e.key === 'ArrowLeft' && idx > 0) {
            e.preventDefault();
            dispatch({ type: 'SELECT_MONTH', id: sorted[idx - 1].id } as never);
          } else if (e.key === 'ArrowRight' && idx < sorted.length - 1) {
            e.preventDefault();
            dispatch({ type: 'SELECT_MONTH', id: sorted[idx + 1].id } as never);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.months, state.activeMonthId, state]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar
        state={state}
        dispatch={dispatch as never}
        computedMonths={months}
        onAddMonth={() => dispatch({ type: 'ADD_MONTH' } as never)}
      />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 60px' }}>
        {months.length === 0 && state.view === 'month' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16, border: '1px solid var(--border)' }}>💸</div>
            <h2 style={{ fontSize: 24, marginBottom: 12, fontWeight: 700 }}>No active months</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Select a month and year to start tracking your budget.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
              <select 
                value={firstMonthIndex} 
                onChange={e => setFirstMonthIndex(parseInt(e.target.value))} 
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 16, cursor: 'pointer', outline: 'none' }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i} style={{ color: '#000' }}>{m}</option>)}
              </select>
              <select 
                value={firstYear} 
                onChange={e => setFirstYear(parseInt(e.target.value))} 
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 16, cursor: 'pointer', outline: 'none' }}
              >
                {[...Array(10)].map((_, i) => { const y = new Date().getFullYear() - 2 + i; return <option key={y} value={y} style={{ color: '#000' }}>{y}</option> })}
              </select>
            </div>
            <button 
              className="green-btn" 
              onClick={() => dispatch({ type: 'ADD_FIRST_MONTH', monthIndex: firstMonthIndex, year: firstYear } as never)}
              style={{ fontSize: 16, padding: '10px 24px' }}
            >
              Create First Month
            </button>
          </div>
        )}
        {months.length > 0 && state.view === 'month' && (
          <MonthView
            state={state}
            active={active}
            dispatch={dispatch as never}
            onRequestPush={requestPush}
            onRequestSweep={requestSweep}
            onDeleteMonth={deleteMonth}
            isFirst={isFirst}
          />
        )}
        {months.length > 0 && state.view === 'dashboard' && (
          <Dashboard
            months={months}
            active={active!}
            onExportCSV={() => exportCSV(months)}
            onBackupJSON={backupJSON}
            onRestoreJSON={(importedState) => dispatch({ type: 'IMPORT_STATE', state: importedState } as never)}
            onAddFund={() => dispatch({ type: 'ADD_FUND' } as never)}
            onUpdateFund={(id, field, value) => dispatch({ type: 'UPDATE_FUND', id, field, value } as never)}
            onRemoveFund={id => dispatch({ type: 'REMOVE_FUND', id } as never)}
            sinkingFunds={state.sinkingFunds}
            settings={state.settings}
          />
        )}
        {state.view === 'trash' && (
          <TrashView
            trash={state.trash}
            onRestore={(id) => dispatch({ type: 'RESTORE_MONTH', id } as never)}
            onPermanentDelete={(id) => dispatch({ type: 'PERMANENT_DELETE_MONTH', id } as never)}
            onEmptyTrash={() => dispatch({ type: 'EMPTY_TRASH' } as never)}
            onClose={() => dispatch({ type: 'SET_VIEW', view: 'month' } as never)}
          />
        )}
        {state.view === 'settings' && (
          <SettingsModal
            settings={state.settings}
            categories={state.categories}
            onSave={(settings) => dispatch({ type: 'UPDATE_SETTINGS', settings } as never)}
            onClose={() => dispatch({ type: 'SET_VIEW', view: 'month' } as never)}
          />
        )}
      </main>

      {state.modal && (
        <PreviewModal
          modal={state.modal}
          onClose={() => dispatch({ type: 'SET_MODAL', modal: null } as never)}
          onConfirm={() => dispatch({ type: 'CONFIRM_MODAL' } as never)}
        />
      )}

      {showSearch && (
        <GlobalSearch 
          months={state.months} 
          onClose={() => setShowSearch(false)} 
          onNavigateToMonth={(id) => {
            dispatch({ type: 'SELECT_MONTH', id } as never);
          }}
        />
      )}
    </div>
  );
}

import { useReducer, useEffect } from 'react';
import type { AppState, MonthData, AllocTarget, ModalData, GlobalSettings } from './types';
import {
  uid, n, fmt, computeIncome, allocByAccount, BUCKETS, MONTHS,
  loadState, saveState, seedState,
} from './utils';

type Action =
  | { type: 'SET_VIEW'; view: 'month' | 'dashboard' }
  | { type: 'SELECT_MONTH'; id: string }
  | { type: 'TOGGLE_YEAR'; year: number }
  | { type: 'ADD_MONTH' }
  | { type: 'DELETE_MONTH'; id: string }
  | { type: 'RESTORE_MONTH'; id: string }
  | { type: 'PERMANENT_DELETE_MONTH'; id: string }
  | { type: 'EMPTY_TRASH' }
  | { type: 'ADD_FIRST_MONTH'; monthIndex: number; year: number }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GlobalSettings> }
  | { type: 'UPDATE_MONTH'; id: string; updater: (m: MonthData) => MonthData }
  | { type: 'SET_SHOW_HELP'; value: boolean }
  | { type: 'SET_SHOW_CAT_MGR'; value: boolean }
  | { type: 'SET_NEW_CAT'; value: string }
  | { type: 'ADD_CATEGORY' }
  | { type: 'REMOVE_CATEGORY'; cat: string }
  | { type: 'SET_EXPENSE_QUERY'; value: string }
  | { type: 'SET_EXPENSE_FILTER_CAT'; value: string }
  | { type: 'SET_MODAL'; modal: ModalData | null }
  | { type: 'CONFIRM_MODAL' }
  | { type: 'SET_DRAG_ID'; id: string | null }
  | { type: 'ADD_FUND' }
  | { type: 'UPDATE_FUND'; id: string; field: string; value: string | number }
  | { type: 'REMOVE_FUND'; id: string }
  | { type: 'SET_THEME'; theme: AppState['theme'] }
  | { type: 'UPDATE_MONTH_DATE'; id: string; monthIndex: number; year: number }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'MIRROR_PREVIOUS_ALLOCATIONS'; id: string };

function updateMonth(state: AppState, id: string, updater: (m: MonthData) => MonthData): AppState {
  return { ...state, months: state.months.map(m => m.id === id ? updater({ ...m }) : m) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_THEME': return { ...state, theme: action.theme };
    case 'IMPORT_STATE': return action.state;
    case 'UPDATE_MONTH_DATE': {
      const month = state.months.find(m => m.id === action.id);
      if (!month) return state;
      const label = MONTHS[action.monthIndex] + ' ' + action.year;
      const nextMonths = state.months.map(m => m.id === action.id ? { ...m, monthIndex: action.monthIndex, year: action.year, label } : m);
      return { ...state, months: nextMonths, yearsOpen: { ...state.yearsOpen, [action.year]: true } };
    }
    case 'MIRROR_PREVIOUS_ALLOCATIONS': {
      const sorted = [...state.months].sort((a, b) => (a.year * 12 + a.monthIndex) - (b.year * 12 + b.monthIndex));
      const idx = sorted.findIndex(m => m.id === action.id);
      if (idx <= 0) return state;
      const prev = sorted[idx - 1];
      const prevAllocs = prev.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
      const cloneAlloc: MonthData['allocations'] = {} as MonthData['allocations'];
      BUCKETS.forEach(([k]) => {
        const b = prevAllocs[k] || { pct: 0, targets: [] };
        (cloneAlloc as Record<string, { pct: number; targets: AllocTarget[] }>)[k] = {
          pct: b.pct,
          targets: (b.targets || []).map(t => ({ id: uid(), accountName: t.accountName, pct: t.pct })),
        };
      });
      return updateMonth(state, action.id, m => ({ ...m, allocations: cloneAlloc }));
    }
    case 'SET_VIEW': return { ...state, view: action.view };
    case 'SELECT_MONTH': {
      const m = state.months.find(x => x.id === action.id);
      const yo = { ...state.yearsOpen };
      if (m) yo[m.year] = true;
      return { ...state, view: 'month', activeMonthId: action.id, yearsOpen: yo };
    }
    case 'TOGGLE_YEAR': {
      const y = action.year;
      const maxY = Math.max(...state.months.map(m => m.year));
      const act = state.months.find(m => m.id === state.activeMonthId) || state.months[state.months.length - 1];
      const cur = state.yearsOpen[y] === undefined ? (y === maxY || y === act.year) : state.yearsOpen[y];
      return { ...state, yearsOpen: { ...state.yearsOpen, [y]: !cur } };
    }
    case 'ADD_MONTH': {
      const prev = state.months[state.months.length - 1];
      let ni = (typeof prev.monthIndex === 'number' ? prev.monthIndex : 7) + 1;
      let yr = prev.year;
      if (ni > 11) { ni = 0; yr++; }
      const cloneAlloc: MonthData['allocations'] = {} as MonthData['allocations'];
      BUCKETS.forEach(([k]) => {
        (cloneAlloc as Record<string, { pct: number; targets: AllocTarget[] }>)[k] = { pct: 0, targets: [] };
      });
      const newExpenses = (state.settings.recurringExpenses || []).map(r => {
        const d = String(r.dayOfMonth).padStart(2, '0');
        const mo = String(ni + 1).padStart(2, '0');
        return {
          id: uid(),
          date: `${yr}-${mo}-${d}`,
          merchant: r.desc,
          amount: r.amount,
          category: r.category
        };
      });

      const nm: MonthData = {
        id: uid(), label: MONTHS[ni] + ' ' + yr, year: yr, monthIndex: ni,
        income: { ...prev.income }, allocations: cloneAlloc,
        swept: false, pushed: false, sweepTarget: prev.sweepTarget,
        expenses: newExpenses, notes: '', transfers: [],
        accounts: prev.accounts.map(a => ({ id: uid(), name: a.name, bank: a.bank, type: a.type, fundedBy: a.fundedBy, start: 0, contribution: 0 })),
        creditCards: prev.creditCards.map(cc => ({ ...cc, id: uid(), startBalance: cc.startBalance || 0 })),
      };
      return { ...state, months: [...state.months, nm], activeMonthId: nm.id, view: 'month', yearsOpen: { ...state.yearsOpen, [yr]: true } };
    }
    case 'DELETE_MONTH': {
      const idx = state.months.findIndex(m => m.id === action.id);
      if (idx < 0) return state;
      const removed = state.months[idx];
      const months = state.months.filter(m => m.id !== action.id);
      let activeMonthId = state.activeMonthId;
      if (months.length > 0) {
        if (activeMonthId === action.id) activeMonthId = months[Math.min(idx, months.length - 1)].id;
      } else {
        activeMonthId = '';
      }
      return { ...state, months, activeMonthId, view: 'month', trash: [...state.trash, removed] };
    }
    case 'ADD_FIRST_MONTH': {
      const template = seedState().months[0];
      const nm: MonthData = {
        ...template,
        id: uid(),
        monthIndex: action.monthIndex,
        year: action.year,
        label: MONTHS[action.monthIndex] + ' ' + action.year,
      };
      return { ...state, months: [nm], activeMonthId: nm.id, view: 'month', yearsOpen: { [action.year]: true } };
    }
    case 'RESTORE_MONTH': {
      const idx = state.trash.findIndex(m => m.id === action.id);
      if (idx < 0) return state;
      const restored = state.trash[idx];
      const trash = state.trash.filter(m => m.id !== action.id);
      return { ...state, months: [...state.months, restored], trash, activeMonthId: restored.id, view: 'month' };
    }
    case 'PERMANENT_DELETE_MONTH': {
      return { ...state, trash: state.trash.filter(m => m.id !== action.id) };
    }
    case 'EMPTY_TRASH': {
      return { ...state, trash: [] };
    }
    case 'UPDATE_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.settings } };
    }
    case 'UPDATE_MONTH': return updateMonth(state, action.id, action.updater);
    case 'SET_SHOW_HELP': return { ...state, showHelp: action.value };
    case 'SET_SHOW_CAT_MGR': return { ...state, showCatMgr: action.value };
    case 'SET_NEW_CAT': return { ...state, newCat: action.value };
    case 'ADD_CATEGORY': {
      const v = (state.newCat || '').trim();
      if (!v) return state;
      if (state.categories.includes(v)) return { ...state, newCat: '' };
      return { ...state, categories: [...state.categories, v], newCat: '' };
    }
    case 'REMOVE_CATEGORY': {
      if (state.categories.length <= 1) return state;
      return { ...state, categories: state.categories.filter(x => x !== action.cat) };
    }
    case 'SET_EXPENSE_QUERY': return { ...state, expenseQuery: action.value };
    case 'SET_EXPENSE_FILTER_CAT': return { ...state, expenseFilterCat: action.value };
    case 'SET_MODAL': return { ...state, modal: action.modal };
    case 'CONFIRM_MODAL': {
      const md = state.modal;
      if (!md) return state;
      let next = state;
      if (md.kind === 'push') {
        const m = state.months.find(x => x.id === state.activeMonthId)!;
        const th = computeIncome(m.income, state.settings).takeHome;
        const map = allocByAccount(m, th);
        const expAcct = ((m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>).necessary?.targets || [])[0];
        const skip = expAcct ? expAcct.accountName : null;
        next = updateMonth(state, m.id, mm => ({
          ...mm, pushed: true,
          accounts: mm.accounts.map(a => (a.name in map && a.name !== skip) ? { ...a, contribution: Math.round(map[a.name] * 100) / 100 } : a),
        }));
      } else if (md.kind === 'sweep') {
        next = updateMonth(state, state.activeMonthId, mm => ({ ...mm, swept: true }));
      }
      return { ...next, modal: null };
    }
    case 'SET_DRAG_ID': return { ...state, dragId: action.id };
    case 'ADD_FUND': return { ...state, sinkingFunds: [...state.sinkingFunds, { id: uid(), bucket: 'New bucket', goal: 0, saved: 0 }] };
    case 'UPDATE_FUND': {
      const v = action.field !== 'bucket' ? n(action.value) : action.value;
      return { ...state, sinkingFunds: state.sinkingFunds.map(x => x.id === action.id ? { ...x, [action.field]: v } : x) };
    }
    case 'REMOVE_FUND': return { ...state, sinkingFunds: state.sinkingFunds.filter(x => x.id !== action.id) };
    default: return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => { saveState(state); }, [state]);

  const activeMonthRaw = () => state.months.find(m => m.id === state.activeMonthId) || state.months[state.months.length - 1];

  const requestPush = () => {
    const m = activeMonthRaw();
    if (m.pushed) { dispatch({ type: 'SET_MODAL', modal: null }); return; }
    const th = computeIncome(m.income, state.settings).takeHome;
    const map = allocByAccount(m, th);
    const allocs = m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
    const expAcct = (allocs.necessary?.targets || [])[0];
    const skip = expAcct ? expAcct.accountName : null;
    const lines = m.accounts
      .filter(a => (a.name in map) && a.name !== skip)
      .map(a => ({ label: a.name, from: fmt(n(a.contribution)), to: fmt(Math.round(map[a.name] * 100) / 100) }));
    dispatch({
      type: 'SET_MODAL', modal: {
        kind: 'push', title: 'Push allocations into contributions', confirmLabel: 'Push allocations',
        note: skip ? `"${skip}" stays live — it is driven by your expenses, not overwritten.` : '',
        lines,
      },
    });
  };

  const requestSweep = () => {
    const m = activeMonthRaw();
    if (m.swept) { return; }
    const th = computeIncome(m.income, state.settings).takeHome;
    const allocs = m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
    const budget = n((allocs.necessary || {}).pct) / 100 * th;
    const spent = m.expenses.reduce((s, e) => s + n(e.amount), 0);
    const leftover = Math.max(budget - spent, 0);
    dispatch({
      type: 'SET_MODAL', modal: {
        kind: 'sweep', title: 'Sweep leftover to savings', confirmLabel: 'Apply sweep',
        note: 'Your Expenses account zeroes out and the leftover lands in the destination account.',
        lines: [{ label: 'Leftover to move', from: '', to: fmt(leftover) }, { label: 'Destination account', from: '', to: m.sweepTarget }],
      },
    });
  };

  const deleteMonth = (id: string) => {
    dispatch({ type: 'DELETE_MONTH', id });
  };

  const exportCSV = (months: ReturnType<typeof import('./utils').computeMonths>) => {
    const esc = (v: unknown) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows: (string | number)[][] = [];
    rows.push(['Monthly Summary']);
    rows.push(['Month','Take-Home','Gross','Total Deductions','Budget','Total Spent','Remaining','Total Assets']);
    months.forEach(m => rows.push([m.label, m.takeHome.toFixed(2), m.grossTotal.toFixed(2), m.totalDeductions.toFixed(2), m.budget.toFixed(2), m.totalSpent.toFixed(2), m.remaining.toFixed(2), m.totalAssets.toFixed(2)]));
    rows.push([]); rows.push(['Expenses']); rows.push(['Month','Date','Description','Category','Amount']);
    months.forEach(m => m.expenses.forEach(e => rows.push([m.label, e.date, e.merchant, e.category, n(e.amount).toFixed(2)])));
    rows.push([]); rows.push(['Accounts — ending balances']); rows.push(['Month','Account','Bank','Type','Start','Contribution','End']);
    months.forEach(m => m.accounts.forEach(a => rows.push([m.label, a.name, a.bank, a.type, a.start.toFixed(2), a.contribution.toFixed(2), a.end.toFixed(2)])));
    const csv = rows.map(r => r.map(esc).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ledger-export.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch { /* ignore */ }
  };

  return { state, dispatch, activeMonthRaw, requestPush, requestSweep, deleteMonth, exportCSV, seedState };
}

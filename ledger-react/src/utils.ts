import type { IncomeData, MonthData, AppState, AllocTarget, GlobalSettings, ComputedCreditCard, ComputedMonth, ComputedAccount } from './types';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const BUCKETS: [string, string][] = [
  ['necessary','Necessary Expenses'],
  ['investments','Investments'],
  ['savings','Savings Deposits'],
  ['spending','Spending Cash'],
];
export const DEST: Record<string, string> = {
  necessary: 'Checking',
  investments: 'Roth IRA',
  savings: 'Emergency Savings',
  spending: 'Checking'
};
export const DEFAULT_CATS = ['Food/Groceries','Eating Out','Gas/Transport','Phone/Bills','Personal','Other'];

export function uid(): string {
  return 'i' + Math.random().toString(36).slice(2, 8) + (Date.now() % 100000).toString(36);
}

export function n(v: unknown): number {
  const x = parseFloat(String(v));
  return isNaN(x) ? 0 : x;
}

export function fmt(v: unknown): string {
  const x = Number(v) || 0;
  const s = '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return x < 0 ? '-' + s : s;
}

export function computeIncome(income: IncomeData, settings: GlobalSettings) {
  const taxableGross = n(income.basePay) + n(income.specialPays);
  const untaxed = n(income.untaxedAllowances);
  const gross = taxableGross + untaxed;
  
  // FICA calculates against taxable base/special pays (even if deployed, FICA is usually still owed).
  const fica = taxableGross * (settings.ficaRate / 100);
  
  // TSP calculates against base pay (often, but we'll use taxableGross for simplicity or just basePay)
  const tspDollar = (n(income.tspPct) / 100) * n(income.basePay);
  
  // If deployed (Combat Zone Tax Exclusion), federal tax is usually zeroed out.
  const actualFed = income.deployed ? 0 : n(income.federalTax);
  const actualState = n(income.stateTax);

  const totalDeductions = fica + actualFed + actualState + n(income.sgli) + n(income.afrh) + n(income.customDeductions) + tspDollar;
  
  return { grossTotal: gross, taxableGross, fica, tspDollar, totalDeductions, takeHome: gross - totalDeductions };
}

export function allocByAccount(m: MonthData, th: number): Record<string, number> {
  const out: Record<string, number> = {};
  BUCKETS.forEach(([k]) => {
    const allocs = m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
    const b = allocs[k] || { pct: 0, targets: [] };
    const bd = n(b.pct) / 100 * th;
    (b.targets || []).forEach(t => {
      const d = bd * n(t.pct) / 100;
      out[t.accountName] = (out[t.accountName] || 0) + d;
    });
  });
  return out;
}

export function computeMonths(state: AppState): ComputedMonth[] {
  let prev: Record<string, number> = {};
  let prevCards: Record<string, number> = {};
  const sortedMonths = [...state.months].sort((a, b) => (a.year * 12 + a.monthIndex) - (b.year * 12 + b.monthIndex));
  return sortedMonths.map(m => {
    const inc = computeIncome(m.income, state.settings);
    const th = inc.takeHome;
    const allocs = m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
    const allocSum = BUCKETS.reduce((s, [k]) => s + n((allocs[k] || {}).pct), 0);
    const budget = n((allocs.necessary || {}).pct) / 100 * th;
    const expAcct = ((allocs.necessary || {}).targets || [])[0];
    const expAcctName = expAcct ? expAcct.accountName : null;
    const totalSpent = m.expenses.reduce((s, e) => s + n(e.amount), 0);
    const remaining = budget - totalSpent;
    const leftover = Math.max(remaining, 0);
    const swept = !!m.swept;
    const catSum = state.categories.map(c => ({
      cat: c,
      amount: m.expenses.filter(e => e.category === c).reduce((s, e) => s + n(e.amount), 0),
    }));
    const tnet: Record<string, number> = {};
    (m.transfers || []).forEach(t => {
      const amt = n(t.amount);
      if (t.from) tnet[t.from] = (tnet[t.from] || 0) - amt;
      if (t.to) tnet[t.to] = (tnet[t.to] || 0) + amt;
    });
    let totalAssets = 0, placed = 0;
    const accounts: ComputedAccount[] = m.accounts.map(acc => {
      const matched = Object.prototype.hasOwnProperty.call(prev, acc.name);
      const start = matched ? prev[acc.name] : n(acc.start);
      let contribution = n(acc.contribution);
      let allocBasis = acc.fundedBy === 'Take-home' ? contribution : 0;
      let auto = false;
      if (acc.name === expAcctName) {
        contribution = swept ? 0 : remaining;
        allocBasis = budget;
        auto = true;
      }
      if (swept && acc.name === m.sweepTarget && acc.name !== expAcctName) {
        contribution = contribution + leftover;
      }
      const end = start + contribution + (tnet[acc.name] || 0);
      totalAssets += end;
      if (acc.fundedBy === 'Take-home') placed += allocBasis;
      return {
        ...acc,
        start,
        end,
        contribution,
        auto,
        startEditable: !matched,
        startFixed: matched,
        manual: !auto,
        startF: fmt(start),
        endF: fmt(end),
        contributionF: fmt(contribution),
        dragOpacity: 1,
      };
    });
    const np = { ...prev };
    accounts.forEach(acc => { np[acc.name] = acc.end; });
    prev = np;

    let totalDebt = 0;
    const creditCards: ComputedCreditCard[] = (m.creditCards || []).map(cc => {
      const matched = Object.prototype.hasOwnProperty.call(prevCards, cc.name);
      const start = matched ? prevCards[cc.name] : n(cc.startBalance);
      const newCharges = m.expenses.filter(e => e.cardId === cc.id).reduce((s, e) => s + n(e.amount), 0);
      const paymentAmt = n(cc.payment);
      const end = start + newCharges - paymentAmt;
      totalDebt += end;
      const limit = n(cc.limit);
      const utilizationPct = limit > 0 ? (end / limit) * 100 : 0;
      return {
        ...cc,
        start,
        newCharges,
        paymentAmt,
        end,
        utilizationPct,
        startEditable: !matched
      };
    });

    const npc = { ...prevCards };
    creditCards.forEach(cc => { npc[cc.name] = cc.end; });
    prevCards = npc;

    return {
      ...m,
      ...inc,
      allocSum,
      budget,
      totalSpent,
      remaining,
      leftover,
      swept,
      expAcctName,
      catSum,
      accounts,
      creditCards,
      totalAssets,
      totalDebt,
      netWorth: totalAssets - totalDebt,
      placed,
      unplaced: th - placed,
    };
  });
}

export function seedState(): AppState {
  const mkAcc = (name: string, bank: string, type: string, fundedBy: string, start: number, contribution: number) =>
    ({ id: uid(), name, bank, type, fundedBy, start, contribution });
  const tgt = (accountName: string, pct: number) => ({ id: uid(), accountName, pct });

  const months: MonthData[] = [];
  const startYear = 2024;
  
  // Starting Balances (Jan 2024, entering BMT)
  let checkingStart = 1500;
  let savingsStart = 500;
  let investStart = 0;
  let tspStart = 0;
  let amexStart = 0;

  // Global Sinking Funds
  let sfEmergency = 500;
  let sfCar = 0;
  let sfTravel = 0;

  for (let year = startYear; year <= 2026; year++) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      
      const id = 'm_' + year + '_' + monthIndex;
      const monthLabel = MONTHS[monthIndex] + ' ' + year;
      const t = (year - 2024) * 12 + monthIndex; // 0 to 35
      
      // Career Timeline & Pay Scale (Assuming E-3 joining with some college credits)
      const isBMT = t >= 0 && t <= 1; // Jan-Feb 2024
      const isTechSchool = t >= 2 && t <= 5; // Mar-Jun 2024
      const isPCS = t === 6; // Jul 2024
      const isDeployed = t >= 14 && t <= 20; // Mar-Sep 2025
      const isE4 = t >= 21; // Promotes to E-4 Senior Airman Oct 2025

      let basePay = isE4 ? 2829.30 : 2377.50; // Base Pay (E-3 vs E-4)
      let bas = 460.25;
      let mealDeduction = (isBMT || isTechSchool || isDeployed) ? 350 : 0; 
      let bah = (isBMT || isTechSchool) ? 0 : 1350.00; // Gets BAH after tech school
      let specialPays = isDeployed ? 325 : 0; // HDP + HFP
      
      let federalTax = isDeployed ? 0 : (basePay * 0.10); // Simple 10% estimation
      let stateTax = isDeployed ? 0 : (basePay * 0.04);
      let tspPct = isDeployed ? 20 : 5; // Bumps TSP during deployment

      const income = { 
        basePay, 
        specialPays, 
        untaxedAllowances: bas + bah, 
        deployed: isDeployed, 
        federalTax, 
        stateTax, 
        sgli: 31, 
        afrh: 0.50, 
        customDeductions: mealDeduction, 
        tspPct, 
        tspType: 'Roth' 
      };

      const ccId1 = 'cc_amex';
      
      let expenses = [];
      let notes = '';

      // Realistic Expense Generation based on Phase of Life
      if (isBMT) {
        notes = 'Basic Military Training. Almost zero spending, just mandated toiletries.';
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-15', merchant: 'BX / Mini-Mall', amount: 45.00, category: 'Personal Care', cardId: undefined });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-20', merchant: 'Cell Phone Bill', amount: 65.00, category: 'Bills', cardId: undefined });
      } else if (isTechSchool) {
        notes = 'Tech School. Living in dorms. Eating at chow hall but ordering pizza and buying gear.';
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-05', merchant: 'Domino\'s Pizza', amount: 25.50, category: 'Eating Out', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-12', merchant: 'Amazon (Boots/Gear)', amount: 140.00, category: 'Shopping', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-20', merchant: 'Cell Phone Bill', amount: 65.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-28', merchant: 'Uber (Weekend Pass)', amount: 45.00, category: 'Transport', cardId: ccId1 });
      } else if (isPCS) {
        notes = 'First PCS Move! Fronted travel costs on AMEX (will get reimbursed). First month rent + deposit.';
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-02', merchant: 'U-Haul / Travel', amount: 850.00, category: 'Travel', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-04', merchant: 'Hotel (During PCS)', amount: 450.00, category: 'Travel', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-10', merchant: 'Apartment Deposit + Rent', amount: 2600.00, category: 'Housing', cardId: undefined }); // Paid from checking
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-15', merchant: 'IKEA (Furniture)', amount: 600.00, category: 'Shopping', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-20', merchant: 'Cell Phone Bill', amount: 65.00, category: 'Bills', cardId: ccId1 });
      } else if (isDeployed) {
        notes = 'Deployed to CENTCOM. Saving heavily. Tax free zone.';
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-01', merchant: 'Apartment Rent', amount: 1300.00, category: 'Housing', cardId: undefined });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-10', merchant: 'USAA Auto Insurance', amount: 110.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-15', merchant: 'Wi-Fi (Deployed Base)', amount: 80.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-20', merchant: 'Cell Phone Bill', amount: 65.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-25', merchant: 'Amazon (Snacks/Care)', amount: 120.00, category: 'Shopping', cardId: ccId1 });
      } else {
        notes = isE4 ? 'Promoted to E-4. Standard month at home station.' : 'Standard month at home station.';
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-01', merchant: 'Apartment Rent', amount: 1300.00, category: 'Housing', cardId: undefined });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-05', merchant: 'Commissary / Groceries', amount: 350.00 + (Math.random() * 50), category: 'Groceries', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-08', merchant: 'Gas Station', amount: 60.00, category: 'Transport', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-10', merchant: 'USAA Auto Insurance', amount: 110.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-15', merchant: 'Internet Bill', amount: 75.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-20', merchant: 'Cell Phone Bill', amount: 65.00, category: 'Bills', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-22', merchant: 'Restaurant / Bar', amount: 120.00 + (Math.random() * 40), category: 'Eating Out', cardId: ccId1 });
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-28', merchant: 'Spotify / Netflix', amount: 25.00, category: 'Subscriptions', cardId: ccId1 });
      }
      
      const cc1New = expenses.filter(e => e.cardId === ccId1).reduce((s, e) => s + Number(e.amount), 0);
      
      // Calculate realistic payment
      // Always pay off the AMEX balance in full if possible, unless it's the PCS month where we float $1000
      let cc1Payment = amexStart + cc1New;
      if (isPCS) {
        cc1Payment = 1000; // Floating debt for PCS
      } else if (t === 7) {
        cc1Payment = amexStart + cc1New; // PCS Reimbursement hits, pay it off entirely
        notes += ' PCS Travel Voucher paid out. Paid off AMEX.';
      }

      // Calculate Allocations (Income - taxes)
      const mockTakeHome = basePay + specialPays + bas + bah - federalTax - stateTax - 31 - 0.50 - mealDeduction - (basePay * (tspPct/100));
      const totalExp = expenses.reduce((s, e) => s + (e.cardId ? 0 : e.amount) + (e.cardId === ccId1 ? cc1Payment : 0), 0);
      let leftover = mockTakeHome - totalExp;

      let emergencyAlloc = leftover > 0 ? leftover * 0.4 : 0;
      let rothAlloc = leftover > 0 ? leftover * 0.4 : 0;
      let spendingAlloc = leftover > 0 ? leftover * 0.2 : 0;

      sfEmergency += emergencyAlloc;

      const m: MonthData = {
        id, label: monthLabel, year, monthIndex,
        income: income as any,
        allocations: {
          necessary: { pct: 0, targets: [tgt('Checking (Bills)', 100)] },
          savings: { pct: 40, targets: [tgt('High Yield Savings', 100)] },
          investments: { pct: 40, targets: [tgt('Vanguard Roth IRA', 100)] },
          spending: { pct: 20, targets: [tgt('Checking (Spending)', 100)] },
        },
        swept: true, pushed: true, sweepTarget: 'High Yield Savings',
        expenses, notes, transfers: [],
        accounts: [
          mkAcc('Checking (Bills)','NFCU','Checking','Take-home', checkingStart, 0), // Base expenses flow through here
          mkAcc('Checking (Spending)','NFCU','Checking','Take-home', 500, spendingAlloc),
          mkAcc('High Yield Savings','AMEX Savings','Savings','Take-home', savingsStart, emergencyAlloc),
          mkAcc('Vanguard Roth IRA','Vanguard','Investment','Take-home', investStart, rothAlloc),
          mkAcc('TSP (payroll)','TSP','Retirement','Payroll', tspStart, basePay * (tspPct/100)),
        ],
        creditCards: [
          { id: ccId1, name: 'AMEX Platinum', limit: 15000, startBalance: amexStart, payment: cc1Payment },
        ]
      };
      
      months.push(m);
      
      // Update starts for next iteration
      checkingStart += (leftover * 0); // Assuming swept
      savingsStart += emergencyAlloc;
      investStart += rothAlloc;
      tspStart += (basePay * (tspPct/100));
      amexStart = amexStart + cc1New - cc1Payment;
    }
  }

  return {
    view: 'dashboard', activeMonthId: months[months.length-1].id, months, yearsOpen: { 2024: false, 2025: false, 2026: true },
    showHelp: false, showCatMgr: false, newCat: '', dragId: null,
    theme: 'classic-dark',
    settings: { ficaRate: 7.65, recurringExpenses: [], leaveStartDate: '2024-01-01' },
    trash: [],
    categories: ['Housing', 'Groceries', 'Eating Out', 'Transport', 'Travel', 'Shopping', 'Bills', 'Personal Care', 'Subscriptions', 'Other'],
    expenseQuery: '', expenseFilterCat: '',
    modal: null, recentlyDeleted: null,
    sinkingFunds: [
      { id: uid(), bucket: 'Emergency Cushion', goal: 10000, saved: sfEmergency },
      { id: uid(), bucket: 'Car Downpayment', goal: 5000, saved: sfCar },
      { id: uid(), bucket: 'Leave / Travel Home', goal: 2000, saved: sfTravel },
    ],
  };
}



export function migrate(s: Partial<AppState> & { months?: MonthData[] }): AppState {
  const base = seedState();
  const out: AppState = { ...base, ...s } as AppState;
  if (!out.yearsOpen) out.yearsOpen = {};
  if (!Array.isArray(out.categories) || !out.categories.length) out.categories = [...DEFAULT_CATS];
  out.modal = null;
  out.recentlyDeleted = null;
  out.showCatMgr = false;
  out.newCat = '';
  if (!out.theme) out.theme = 'classic-dark';
  if (!out.settings) out.settings = { ficaRate: 7.65, recurringExpenses: [] };
  if (!out.settings.recurringExpenses) out.settings.recurringExpenses = [];
  if (!out.trash) out.trash = [];
  if (typeof out.expenseQuery !== 'string') out.expenseQuery = '';
  if (typeof out.expenseFilterCat !== 'string') out.expenseFilterCat = '';
  (out.months || []).forEach(m => {
    const toks = String(m.label || '').trim().split(/\s+/);
    if (typeof m.year !== 'number') { const y = parseInt(toks[toks.length - 1]); m.year = isNaN(y) ? 2026 : y; }
    if (typeof m.monthIndex !== 'number') { const mi = MONTHS.indexOf(toks[0]); m.monthIndex = mi < 0 ? 0 : mi; }
    const inc = m.income as Record<string, unknown>;
    if (inc) {
      if (inc.tspPct == null) {
        const gross = n(inc.basePay) + n(inc.otherIncome);
        inc.tspPct = gross > 0 ? Math.round(n(inc.tsp as number) / gross * 10000) / 100 : 5;
        delete inc.tsp;
      }
      if (inc.federal !== undefined) { inc.federalTax = n(inc.federal); delete inc.federal; }
      if (inc.cnmi !== undefined) { inc.stateTax = n(inc.cnmi); delete inc.cnmi; }
      if (inc.otherIncome !== undefined) { inc.untaxedAllowances = n(inc.otherIncome); delete inc.otherIncome; }
      if (typeof inc.specialPays !== 'number') inc.specialPays = 0;
      if (typeof inc.untaxedAllowances !== 'number') inc.untaxedAllowances = 0;
      if (typeof inc.deployed !== 'boolean') inc.deployed = false;
      if (typeof inc.stateTax !== 'number') inc.stateTax = 0;
      if (typeof inc.federalTax !== 'number') inc.federalTax = 0;
      if (typeof inc.afrh !== 'number') inc.afrh = 0.50;
      if (typeof inc.customDeductions !== 'number') inc.customDeductions = 0;
      if (typeof inc.tspType !== 'string') inc.tspType = 'Roth';
    }
    const allocs = m.allocations as Record<string, unknown>;
    if (allocs && typeof allocs.necessary === 'number') {
      const old = allocs as Record<string, number>;
      const na: Record<string, { pct: number; targets: AllocTarget[] }> = {};
      BUCKETS.forEach(([k]) => { na[k] = { pct: n(old[k]), targets: [{ id: uid(), accountName: DEST[k], pct: 100 }] }; });
      m.allocations = na as typeof m.allocations;
    }
    const mAllocs = m.allocations as Record<string, { pct: number; targets: AllocTarget[] }>;
    if (mAllocs) BUCKETS.forEach(([k]) => {
      if (!mAllocs[k]) mAllocs[k] = { pct: 0, targets: [] };
      if (!mAllocs[k].targets) mAllocs[k].targets = [];
    });
    if (!m.sweepTarget) m.sweepTarget = 'Emergency Savings';
    if (typeof m.swept !== 'boolean') m.swept = false;
    if (typeof m.pushed !== 'boolean') m.pushed = false;
    if (typeof m.notes !== 'string') m.notes = '';
    if (!Array.isArray(m.transfers)) m.transfers = [];
    if (!Array.isArray(m.creditCards)) m.creditCards = [];
  });
  return out;
}

export function loadState(): AppState {
  try {
    const r = localStorage.getItem('ledger-app-v3');
    if (r) {
      const s = JSON.parse(r);
      if (s && s.months && s.months.length) return migrate(s);
    }
  } catch { /* ignore */ }
  return seedState();
}

export function saveState(state: AppState) {
  try { localStorage.setItem('ledger-app-v3', JSON.stringify(state)); } catch { /* ignore */ }
}

export interface AllocTarget {
  id: string;
  accountName: string;
  pct: number;
}

export interface AllocBucket {
  pct: number;
  targets: AllocTarget[];
}

export interface Allocations {
  necessary: AllocBucket;
  investments: AllocBucket;
  savings: AllocBucket;
  spending: AllocBucket;
  [key: string]: AllocBucket;
}

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  amount: number | string;
  category: string;
  cardId?: string; // If undefined, assume paid from checking/cash
}

export interface CreditCardData {
  id: string;
  name: string;
  limit: number | string;
  startBalance: number | string;
  payment: number | string; // amount paid towards this card from checking
}

export interface ComputedCreditCard extends CreditCardData {
  start: number;
  newCharges: number; // calculated from expenses
  paymentAmt: number;
  end: number;
  utilizationPct: number;
  startEditable: boolean;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
}

export interface AccountRow {
  id: string;
  name: string;
  bank: string;
  type: string;
  fundedBy: string;
  start: number;
  contribution: number;
}

export interface ComputedAccount extends AccountRow {
  end: number;
  auto: boolean;
  startEditable: boolean;
  startFixed: boolean;
  manual: boolean;
  startF: string;
  endF: string;
  contributionF: string;
  dragOpacity: number;
}

export interface IncomeData {
  basePay: number;
  specialPays: number;
  untaxedAllowances: number;
  deployed: boolean;
  federalTax: number;
  stateTax: number;
  sgli: number;
  afrh: number;
  customDeductions: number;
  tspPct: number;
  tspType: 'Roth' | 'Traditional';
  [key: string]: number | boolean | string | undefined;
}

export interface MonthData {
  id: string;
  label: string;
  year: number;
  monthIndex: number;
  income: IncomeData;
  allocations: Allocations;
  swept: boolean;
  pushed: boolean;
  sweepTarget: string;
  expenses: Expense[];
  notes: string;
  transfers: Transfer[];
  accounts: AccountRow[];
  creditCards: CreditCardData[];
}

export interface SinkingFund {
  id: string;
  bucket: string;
  goal: number;
  saved: number;
}

export interface ModalLine {
  label: string;
  from: string;
  to: string;
}

export interface ModalData {
  kind: 'push' | 'sweep';
  title: string;
  confirmLabel: string;
  note: string;
  lines: ModalLine[];
}

export interface RecentlyDeleted {
  month: MonthData;
  index: number;
}

export interface RecurringExpense {
  id: string;
  dayOfMonth: number;
  desc: string;
  amount: number;
  category: string;
}

export interface GlobalSettings {
  ficaRate: number;
  recurringExpenses: RecurringExpense[];
  leaveStartDate?: string;
}

export interface AppState {
  view: 'month' | 'dashboard' | 'trash' | 'settings';
  activeMonthId: string;
  months: MonthData[];
  yearsOpen: Record<number, boolean>;
  showHelp: boolean;
  showCatMgr: boolean;
  newCat: string;
  categories: string[];
  expenseQuery: string;
  expenseFilterCat: string;
  modal: ModalData | null;
  recentlyDeleted: RecentlyDeleted | null;
  trash: MonthData[];
  sinkingFunds: SinkingFund[];
  dragId: string | null;
  theme: 'classic-dark' | 'emerald-dark' | 'slate-light' | 'warm-light';
  settings: GlobalSettings;
}

export interface ComputedMonth extends MonthData {
  grossTotal: number;
  fica: number;
  tspDollar: number;
  totalDeductions: number;
  takeHome: number;
  allocSum: number;
  budget: number;
  totalSpent: number;
  remaining: number;
  leftover: number;
  expAcctName: string | null;
  catSum: { cat: string; amount: number }[];
  accounts: ComputedAccount[];
  creditCards: ComputedCreditCard[];
  totalAssets: number;
  totalDebt: number; // sum of all end balances of credit cards
  netWorth: number; // totalAssets - totalDebt
  placed: number;
  unplaced: number;
}

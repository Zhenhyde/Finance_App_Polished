import Dexie from 'dexie';

export const db = new Dexie('CapitalMatrixDB');

db.version(1).stores({
  transactions: '++id, amount, category, date',
  credit_cards: '++id, name, limit, balance, statement_date',
  credit_ladder: '++id, name, target_date, notes, status'
});

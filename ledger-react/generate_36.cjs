const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, 'src/utils.ts');
let utilsCode = fs.readFileSync(utilsPath, 'utf8');

const simulateCode = `export function seedState(): AppState {
  const mid = 'm_seed';
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
  let chaseStart = 0;

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
        expenses.push({ id: uid(), date: year + '-' + String(monthIndex + 1).padStart(2, '0') + '-05', merchant: 'Domino\\'s Pizza', amount: 25.50, category: 'Eating Out', cardId: ccId1 });
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
          expenses: { pct: 0, targets: [tgt('Checking (Bills)', 100)] },
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
`;

utilsCode = utilsCode.replace(/export function seedState\(\): AppState \{[\s\S]*?return \{[\s\S]*?sinkingFunds: \[[\s\S]*?\],[\s\S]*?\};[\s\S]*?\}/, simulateCode);

fs.writeFileSync(utilsPath, utilsCode);
console.log('Seed state updated with REALISTIC 36 months.');

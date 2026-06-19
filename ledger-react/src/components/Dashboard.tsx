import { useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import type { ComputedMonth, AppState } from '../types';
import { fmt } from '../utils';

interface Props {
  months: ComputedMonth[];
  active: ComputedMonth;
  onExportCSV: () => void;
  onBackupJSON: () => void;
  onRestoreJSON: (state: AppState) => void;
  onAddFund: () => void;
  onUpdateFund: (id: string, field: string, value: string | number) => void;
  onRemoveFund: (id: string) => void;
  sinkingFunds: { id: string; bucket: string; goal: number; saved: number }[];
  settings: import('../types').GlobalSettings;
}

export default function Dashboard({ months, active, onExportCSV, onBackupJSON, onRestoreJSON, onAddFund, onUpdateFund, onRemoveFund, sinkingFunds, settings }: Props) {
  const latest = months[months.length - 1]?.totalAssets ?? 0;
  const first = months[0]?.totalAssets ?? 0;
  const delta = latest - first;
  const deltaColor = delta >= 0 ? 'var(--accent)' : 'var(--danger)';
  const deltaStr = months.length > 1 ? (delta >= 0 ? '+' : '') + fmt(delta) : '';

  // Net worth data
  const netWorthData = months.map(m => ({
    name: m.label,
    Assets: m.netWorth, // Updated to use true net worth
  }));

  // Spending trend data
  const recent = months.slice(-6);
  const spendData = recent.map(m => ({
    name: m.label,
    Spent: m.totalSpent,
    Budget: m.budget,
  }));

  // Category data
  const catBars = active.catSum
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  
  const COLORS = ['var(--pie-1)', 'var(--pie-2)', 'var(--pie-3)', 'var(--pie-4)', 'var(--pie-5)', 'var(--pie-6)'];

  // Dashboard summary table
  const getAcc = (m: ComputedMonth, name: string) => m.accounts.find(a => a.name === name)?.end ?? 0;
  const dashMetrics = [
    { label: 'Take-Home', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(m.takeHome)) },
    { label: 'Total Spent', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(m.totalSpent)) },
    { label: 'Emergency Savings', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(getAcc(m, 'Emergency Savings'))) },
    { label: 'Roth IRA', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(getAcc(m, 'Roth IRA / Investments'))) },
    { label: 'TSP', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(getAcc(m, 'TSP (payroll)'))) },
    { label: 'Total Assets', color: 'var(--text-main)', weight: '400' as const, vals: months.map(m => fmt(m.totalAssets)) },
    { label: 'Credit Card Debt', color: 'var(--danger)', weight: '400' as const, vals: months.map(m => fmt(m.totalDebt || 0)) },
    { label: 'Net Worth', color: 'var(--accent)', weight: '600' as const, vals: months.map(m => fmt(m.netWorth)) },
  ];

  // Sinking funds
  const totalSaved = sinkingFunds.reduce((s, f) => s + (f.saved || 0), 0);
  const totalGoal = sinkingFunds.reduce((s, f) => s + (f.goal || 0), 0);
  const fundsPct = totalGoal > 0 ? Math.min(totalSaved / totalGoal * 100, 100) : 0;

  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const obj = JSON.parse(ev.target?.result as string);
        if (obj && obj.months) onRestoreJSON(obj);
      } catch {
        alert("Invalid JSON backup file");
      }
    };
    r.readAsText(file);
    e.target.value = '';
  };

  const getLeaveAccrued = () => {
    if (!settings.leaveStartDate) return 0;
    const start = new Date(settings.leaveStartDate);
    const now = new Date();
    // month diff
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, diffMonths * 2.5);
  };
  const leaveAccrued = getLeaveAccrued();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Overview</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}>
            <span style={{ fontFamily: "'IBM Plex Mono'" }}>↑</span> Restore JSON
          </button>
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".json" onChange={handleFile} />
          <button className="ghost-btn-sm" onClick={onBackupJSON}>
            <span style={{ fontFamily: "'IBM Plex Mono'" }}>↓</span> Backup JSON
          </button>
          <button className="ghost-btn-sm" onClick={onExportCSV}>
            <span style={{ fontFamily: "'IBM Plex Mono'" }}>↓</span> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="section-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4, fontWeight: 600 }}>Active Month</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{active?.label || 'N/A'}</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
        </div>
        <div className="section-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4, fontWeight: 600 }}>Accrued Leave</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{leaveAccrued} Days</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✈️</div>
        </div>
      </div>

      {/* Net Worth Chart */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Net Worth</h3>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 22, fontWeight: 600, color: 'var(--accent)' }}>{fmt(latest)}</span>
            {' '}
            <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, color: deltaColor }}>{deltaStr}</span>
          </div>
        </div>
        <div style={{ height: 260, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value: any) => [fmt(value), 'Net Worth']}
                contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)' }}
              />
              <Area type="monotone" dataKey="Assets" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAssets)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Trend + Category Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>
        <div className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Spending vs Budget</h3>
          </div>
          <div style={{ height: 200, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => fmt(value)}
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Spent" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Budget" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="section-card">
          <h3 style={{ margin: 0, marginBottom: 4, fontSize: 15, fontWeight: 600 }}>Spending by Category</h3>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{active.label}</div>
          {catBars.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '14px 0' }}>No expenses logged this month.</div>}
          {catBars.length > 0 && (
            <div style={{ height: 200, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catBars}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="cat"
                  >
                    {catBars.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => fmt(value)}
                    contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="section-card" style={{ marginBottom: 20, overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Monthly Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 12px 10px 0' }}>Metric</th>
              {months.map(m => (
                <th key={m.id} style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-main)', fontWeight: 600, padding: '0 0 10px 16px', fontFamily: "'IBM Plex Mono'" }}>{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashMetrics.map(row => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 12px 9px 0', fontSize: 13, color: row.label === 'Net Worth' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: row.weight, whiteSpace: 'nowrap' }}>{row.label}</td>
                {row.vals.map((v, i) => (
                  <td key={i} style={{ textAlign: 'right', padding: '9px 0 9px 16px', fontFamily: "'IBM Plex Mono'", fontSize: 13, color: row.color, fontWeight: row.weight }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sinking Funds */}
      <div className="section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sinking Funds</h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Earmarks of savings — tracked manually</div>
          </div>
          <button className="dashed-btn-sm" onClick={onAddFund}>+ Add bucket</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Saved</div><div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{fmt(totalSaved)}</div></div>
          <div style={{ color: 'var(--border-hover)', fontSize: 16 }}>/</div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Goal</div><div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 18, fontWeight: 600, color: 'var(--text-main)' }}>{fmt(totalGoal)}</div></div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall progress</span>
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--text-muted)' }}>{fundsPct.toFixed(1)}% · {fmt(Math.max(totalGoal - totalSaved, 0))} to go</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-main)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fundsPct}%`, background: 'var(--accent)', borderRadius: 4 }} />
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Bucket','Goal','Saved','Remaining','Progress',''].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 1 && i <= 3 ? 'right' : 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', padding: '0 8px 8px', width: i === 0 ? 'auto' : i === 1 || i === 2 || i === 3 ? 110 : i === 4 ? 180 : 30 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sinkingFunds.map(f => {
              const goal = f.goal || 0, saved = f.saved || 0;
              const pct = goal > 0 ? Math.min(saved / goal * 100, 100) : 0;
              const remaining = Math.max(goal - saved, 0);
              return (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px 6px 0' }}>
                    <input type="text" value={f.bucket} onChange={e => onUpdateFund(f.id, 'bucket', e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" step="1" value={goal} onChange={e => onUpdateFund(f.id, 'goal', e.target.value)} onFocus={ev => ev.target.select()}
                      style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" step="1" value={saved} onChange={e => onUpdateFund(f.id, 'saved', e.target.value)} onFocus={ev => ev.target.select()}
                      style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '6px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 12, textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontSize: 13, color: 'var(--text-main)' }}>{fmt(remaining)}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 7, background: 'var(--bg-main)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--text-muted)', width: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => onRemoveFund(f.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}

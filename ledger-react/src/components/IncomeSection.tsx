import React from 'react';
import type { ComputedMonth } from '../types';
import { fmt, n } from '../utils';
import AbbrTooltip from './AbbrTooltip';

interface Props {
  active: ComputedMonth;
  activeId: string;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
  onDeleteMonth: (id: string) => void;
}

export default function IncomeSection({ active, dispatch }: Props) {
  const upd = (field: string, v: number | boolean | string) =>
    dispatch({ type: 'UPDATE_MONTH', id: active.id, updater: (m: import('../types').MonthData) => ({ ...m, income: { ...m.income, [field]: v }, swept: false, pushed: false }) } as never);

  const inp = (label: React.ReactNode, field: string, value: number, w = 100) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number" step="0.01" value={value}
        onChange={e => upd(field, n(e.target.value))}
        onFocus={e => e.target.select()}
        className="field-input"
        style={{ width: w }}
      />
    </div>
  );

  const row = (label: React.ReactNode, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, color: 'var(--text-main)' }}>{value}</span>
    </div>
  );

  const brsMatch = active.income.tspPct >= 5;

  return (
    <div className="section-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>1</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Military Income & Deductions</h3>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, background: active.income.deployed ? 'var(--accent-bg)' : 'transparent', border: `1px solid ${active.income.deployed ? 'var(--accent)' : 'var(--border)'}`, padding: '4px 8px', borderRadius: 20, color: active.income.deployed ? 'var(--accent)' : 'var(--text-muted)' }}>
          <input type="checkbox" checked={!!active.income.deployed} onChange={e => upd('deployed', e.target.checked)} style={{ cursor: 'pointer' }} />
          <AbbrTooltip text="CZTE (Deployed)" full="Combat Zone Tax Exclusion" desc="Zeros out your Federal income tax. (FICA is usually still owed)." />
        </label>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 8, marginBottom: 4, letterSpacing: '1px' }}>Taxable Pay</div>
      {inp('Base Pay', 'basePay', active.income.basePay as number)}
      {inp(<AbbrTooltip text="Special Pays" full="Special & Incentive Pays" desc="Flight pay, hazard pay, or any other taxable pays." />, 'specialPays', active.income.specialPays as number)}

      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 12, marginBottom: 4, letterSpacing: '1px' }}>Untaxed Allowances</div>
      {inp(<AbbrTooltip text="BAH / BAS / COLA / DLA" full="Allowances" desc="Basic Allowance for Housing, Subsistence, Cost of Living Allowance, Dislocation Allowance, etc. Untaxed money." />, 'untaxedAllowances', active.income.untaxedAllowances as number)}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '8px 0' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gross Total</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 14, fontWeight: 500, color: 'var(--text-main)' }}>{fmt(active.grossTotal)}</span>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 8, marginBottom: 4, letterSpacing: '1px' }}>Deductions</div>
      {row(`FICA / Medicare (Auto)`, `−${fmt(active.fica)}`)}
      {active.income.deployed ? (
        row(<AbbrTooltip text="Federal Tax" full="Federal Income Tax" desc="Federal tax is zeroed out due to Combat Zone Tax Exclusion." />, <span style={{ color: 'var(--accent)' }}>Exempt</span>)
      ) : (
        inp('Federal Tax', 'federalTax', active.income.federalTax as number)
      )}
      {inp('State Tax', 'stateTax', active.income.stateTax as number)}
      {inp(<AbbrTooltip text="SGLI" full="Servicemembers' Group Life Insurance" desc="Optional coverage up to $500,000." />, 'sgli', active.income.sgli as number)}
      {inp(<AbbrTooltip text="AFRH" full="Armed Forces Retirement Home" desc="Mandatory $0.50 deduction." />, 'afrh', active.income.afrh as number)}
      {inp('Custom Deductions', 'customDeductions', active.income.customDeductions as number)}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', marginTop: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <AbbrTooltip text="TSP" full="Thrift Savings Plan" desc="Government-sponsored retirement savings. Contributes pre/post-tax from your base pay." />
          </span>
          {brsMatch && <span style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 6px', borderRadius: 4, marginTop: 4, width: 'max-content' }}>✓ BRS Match</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select 
            value={active.income.tspType as string} 
            onChange={e => upd('tspType', e.target.value)}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}
          >
            <option value="Roth">Roth</option>
            <option value="Traditional">Trad</option>
          </select>
          <input
            type="number" step="1" value={active.income.tspPct as number}
            onChange={e => upd('tspPct', n(e.target.value))}
            onFocus={e => e.target.select()}
            style={{ width: 44, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 6, padding: '5px 8px', fontFamily: "'IBM Plex Mono'", fontSize: 13, textAlign: 'right' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>%</span>
          <span style={{ width: 70, textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontSize: 13, color: 'var(--text-main)' }}>−{fmt(active.tspDollar)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Deductions</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 14, color: 'var(--text-main)' }}>−{fmt(active.totalDeductions)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', marginTop: 10, background: 'var(--accent-bg)', border: '1px solid var(--accent-hover)', borderRadius: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Take-Home (Net Pay)</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 17, fontWeight: 600, color: 'var(--accent)' }}>{fmt(active.takeHome)}</span>
      </div>
    </div>
  );
}

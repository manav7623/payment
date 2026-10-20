import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { formatINR } from '../utils/formatters';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: '10px',
        padding: '0.65rem 0.85rem',
        fontSize: '0.82rem',
        boxShadow: '0 4px 14px rgba(15,23,42,0.1)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.2rem', fontSize: '0.78rem' }}>
          {label}
        </div>
        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.98rem' }}>
          {formatINR(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

export default function PaymentChart({ data, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '0.88rem' }}>
        No spending history available for the chart yet.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '0.5rem', borderBottom: 'none' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
          <span>Monthly Spending Trend</span>
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>Past 6 Months</span>
      </div>
      <div style={{ width: '100%', height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expenseBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="url(#expenseBarGradient)" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={36} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

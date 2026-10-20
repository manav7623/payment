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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        fontSize: '0.82rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
          {label}
        </div>
        <div style={{ color: 'var(--primary)', fontWeight: 500 }}>
          Total: {formatINR(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

export default function PaymentChart({ data, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
        No payment history available for the chart yet.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '0.5rem', borderBottom: 'none' }}>
        <h3 className="card-title">Monthly Payments Trend</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Past 6 Months (₹)</span>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

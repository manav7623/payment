import React from 'react';
import { formatINR } from '../utils/formatters';
import { PieChart, Tag } from 'lucide-react';

export default function CategorySummary({ categories = [], loading }) {
  if (loading) {
    return (
      <div className="card" style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="card">
        <div className="card-header" style={{ marginBottom: '0.5rem' }}>
          <h3 className="card-title">Expense Category Summary</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>This Month</span>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.88rem' }}>
          No category spending recorded for this month yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PieChart size={17} style={{ color: 'var(--primary)' }} />
          <span>Expense Category Summary</span>
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>This Month's Breakdown</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'inline-block'
                }}></span>
                <span>{cat.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>({cat.count})</span>
              </div>
              <div style={{ fontWeight: 600 }}>
                {formatINR(cat.amount)}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginLeft: '6px' }}>
                  ({cat.percentage}%)
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${cat.percentage}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--primary)',
                  borderRadius: '9999px'
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

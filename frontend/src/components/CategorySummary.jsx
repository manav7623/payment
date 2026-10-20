import React from 'react';
import { formatINR } from '../utils/formatters';
import { PieChart } from 'lucide-react';
import { getCategoryTheme } from '../utils/categoryTheme';

export default function CategorySummary({ categories = [], loading }) {
  if (loading) {
    return (
      <div className="card" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="card">
        <div className="card-header" style={{ marginBottom: '0.5rem' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={18} style={{ color: 'var(--primary)' }} />
            <span>Top Categories</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>This Month</span>
        </div>
        <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-light)', fontSize: '0.88rem' }}>
          No category spending recorded for this month yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '0.85rem', paddingBottom: '0.65rem' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={18} style={{ color: 'var(--primary)' }} />
          <span>Top Categories</span>
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 }}>
          This Month
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {categories.map((cat, idx) => {
          const theme = getCategoryTheme(cat.category);
          const CatIcon = theme.icon;

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    backgroundColor: theme.bg,
                    color: theme.color,
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CatIcon size={14} />
                  </div>
                  <span style={{ color: 'var(--text-main)' }}>{cat.category}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontWeight: 400 }}>
                    ({cat.count})
                  </span>
                </div>

                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatINR(cat.amount)}
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-light)', fontWeight: 500, marginLeft: '6px' }}>
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${cat.percentage}%`, 
                    height: '100%', 
                    backgroundColor: theme.color || 'var(--primary)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { formatINR } from '../utils/formatters';
import { Filter, ChevronDown, ChevronUp, RotateCcw, Search, Download, X } from 'lucide-react';

export default function FilterPanel({
  filters,
  setFilters,
  onReset,
  summary,
  onExportCSV,
  categories = []
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const periods = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' }
  ];

  const defaultCategories = [
    'Food & Dining',
    'Groceries',
    'Transport & Fuel',
    'Bills & Utilities',
    'Shopping',
    'Entertainment',
    'Health & Medical',
    'Education',
    'Personal Care',
    'Others'
  ];

  const categoryOptions = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;
  const methods = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Other'];

  const handlePeriodChange = (p) => {
    setFilters(prev => ({
      ...prev,
      period: p,
      startDate: p === 'custom' ? prev.startDate : '',
      endDate: p === 'custom' ? prev.endDate : ''
    }));
  };

  const activeFiltersCount = [
    filters.period !== 'all',
    filters.category !== 'all',
    filters.method !== 'all',
    Boolean(filters.minAmount),
    Boolean(filters.maxAmount),
    Boolean(filters.search)
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="filter-bar">
      {/* Quick Period Tabs (Horizontal touch scroll) */}
      <div className="quick-period-tabs">
        {periods.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriodChange(p.id)}
            className={`period-tab-btn ${filters.period === p.id ? 'active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range if 'custom' is selected */}
      {filters.period === 'custom' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.5rem',
          marginBottom: '0.85rem',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              From Date
            </label>
            <input
              type="date"
              className="form-input"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              To Date
            </label>
            <input
              type="date"
              className="form-input"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Search Input & Collapsible Toggle Row */}
      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.65rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-light)' 
            }} 
          />
          <input
            type="text"
            className="form-input"
            style={{ 
              paddingLeft: '2.25rem', 
              paddingRight: filters.search ? '2rem' : '0.75rem',
              minHeight: '40px', 
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-full)'
            }}
            placeholder="Search expenses, notes..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn btn-secondary btn-sm ${hasActiveFilters ? 'btn-primary' : ''}`}
          style={{ height: '40px', gap: '0.35rem', borderRadius: 'var(--radius-full)', padding: '0 0.85rem' }}
        >
          <Filter size={14} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span style={{ 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              borderRadius: '99px', 
              padding: '1px 6px', 
              fontSize: '0.72rem' 
            }}>
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="btn btn-secondary btn-sm"
            style={{ height: '40px', width: '40px', padding: 0, borderRadius: 'var(--radius-full)' }}
            title="Reset Filters"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* Expanded Collapsible Filter Controls */}
      {isExpanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.65rem',
          padding: '0.85rem',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.75rem',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              Category
            </label>
            <select
              className="form-select"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              Payment Method
            </label>
            <select
              className="form-select"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.method}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
            >
              <option value="all">All Methods</option>
              {methods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              Min (₹)
            </label>
            <input
              type="number"
              placeholder="Min ₹"
              className="form-input"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>
              Max (₹)
            </label>
            <input
              type="number"
              placeholder="Max ₹"
              className="form-input"
              style={{ minHeight: '38px', fontSize: '0.85rem' }}
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Filtered Total & Transaction Count Bar */}
      <div className="filter-summary-row">
        <div className="filter-metrics">
          <span>Found: <strong>{summary?.filtered_count || 0}</strong> records</span>
          <span style={{ margin: '0 0.5rem', color: 'var(--border-input)' }}>•</span>
          <span>Total: <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatINR(summary?.filtered_total || 0)}</strong></span>
        </div>

        {onExportCSV && (
          <button
            type="button"
            onClick={onExportCSV}
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: 'flex-start', borderRadius: 'var(--radius-sm)' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}

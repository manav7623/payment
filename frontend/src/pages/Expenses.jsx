import React, { useState, useEffect } from 'react';
import api from '../api/client';
import FilterPanel from '../components/FilterPanel';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import { PlusCircle, Receipt, RefreshCw } from 'lucide-react';

export default function Expenses({
  onOpenAddExpense,
  onViewExpenseDetails,
  onEditExpense,
  onDeleteExpense
}) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    period: 'all',
    startDate: '',
    endDate: '',
    category: 'all',
    method: 'all',
    minAmount: '',
    maxAmount: '',
    search: ''
  });

  // Load categories for filter dropdown
  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  const fetchExpenses = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      if (filters.period && filters.period !== 'all') params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.method && filters.method !== 'all') params.append('method', filters.method);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.expenses || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchExpenses(true);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [filters]);

  // Periodic polling to receive latest records automatically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExpenses(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      period: 'all',
      startDate: '',
      endDate: '',
      category: 'all',
      method: 'all',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period && filters.period !== 'all') params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.method && filters.method !== 'all') params.append('method', filters.method);

      const res = await api.get(`/reports/export-csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MD_Expenses_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV report.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Expense History</h1>
          <p style={{ fontSize: '0.88rem' }}>
            Review and manage all your past personal spending records.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={() => fetchExpenses(true)}
            className="btn btn-secondary btn-sm"
            title="Refresh List"
            style={{ height: '38px' }}
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="btn btn-primary"
            style={{ height: '38px' }}
          >
            <PlusCircle size={17} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onReset={handleResetFilters}
        summary={summary}
        onExportCSV={handleExportCSV}
        categories={categories}
      />

      {/* Content: Cards on Mobile, Table on Desktop */}
      {loading && expenses.length === 0 ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading expense records...</div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="state-box">
          <Receipt size={32} className="state-box-icon" />
          <div className="state-box-title">No expenses found</div>
          <div className="state-box-desc">
            No expense records match your current filter settings.
          </div>
          {Object.values(filters).some(v => v !== 'all' && v !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View: Transaction Cards */}
          <div className="mobile-only tx-card-list">
            {expenses.map(exp => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                onViewDetails={onViewExpenseDetails}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="desktop-only">
            <ExpenseTable
              expenses={expenses}
              onViewDetails={onViewExpenseDetails}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
            />
          </div>
        </>
      )}
    </div>
  );
}

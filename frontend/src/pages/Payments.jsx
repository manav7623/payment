import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import FilterPanel from '../components/FilterPanel';
import PaymentCard from '../components/PaymentCard';
import PaymentTable from '../components/PaymentTable';
import { PlusCircle, Receipt, Download } from 'lucide-react';

export default function Payments({
  onOpenAddPayment,
  onViewPaymentDetails,
  onVerifyPayment,
  onRejectPayment
}) {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    period: 'all',
    startDate: '',
    endDate: '',
    status: 'all',
    category: 'all',
    method: 'all',
    clientId: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });

  // Load clients if admin
  useEffect(() => {
    if (isAdmin) {
      api.get('/clients')
        .then(res => setClients(res.data.clients || []))
        .catch(err => console.error('Error fetching clients:', err));
    }
  }, [isAdmin]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.period && filters.period !== 'all') params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.method && filters.method !== 'all') params.append('method', filters.method);
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/payments?${params.toString()}`);
      setPayments(res.data.payments || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      period: 'all',
      startDate: '',
      endDate: '',
      status: 'all',
      category: 'all',
      method: 'all',
      clientId: '',
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
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.method && filters.method !== 'all') params.append('method', filters.method);
      if (filters.clientId) params.append('clientId', filters.clientId);

      const res = await api.get(`/reports/export-csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PayTrack_Transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV report.');
    }
  };

  const handleInlineVerify = async (paymentId) => {
    await onVerifyPayment(paymentId);
    fetchPayments();
  };

  const handleInlineReject = (payment) => {
    onViewPaymentDetails(payment);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Payment History</h1>
          <p style={{ fontSize: '0.88rem' }}>
            {isAdmin ? 'Search, verify, and filter records across all clients.' : 'Search and filter your past payments and receipts.'}
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={onOpenAddPayment}
            className="btn btn-primary"
          >
            <PlusCircle size={17} />
            <span>Add Payment</span>
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
        clients={clients}
        isAdmin={isAdmin}
      />

      {/* Payments Content List / Table */}
      {loading ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading payment records...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="state-box">
          <Receipt size={32} className="state-box-icon" />
          <div className="state-box-title">No transactions found</div>
          <div className="state-box-desc">
            No payments match your current filter settings. Try adjusting or resetting filters.
          </div>
          {Object.values(filters).some(v => v !== 'all' && v !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View: Transaction Cards */}
          <div className="mobile-only tx-card-list">
            {payments.map(p => (
              <PaymentCard
                key={p.id}
                payment={p}
                onViewDetails={onViewPaymentDetails}
                showClient={isAdmin}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="desktop-only">
            <PaymentTable
              payments={payments}
              onViewDetails={onViewPaymentDetails}
              onVerify={handleInlineVerify}
              onReject={handleInlineReject}
              showClient={isAdmin}
              isAdmin={isAdmin}
            />
          </div>
        </>
      )}
    </div>
  );
}

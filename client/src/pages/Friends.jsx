import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  Users, 
  PlusCircle, 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Check, 
  Phone, 
  RefreshCw,
  Filter
} from 'lucide-react';

export default function Friends({ onOpenFriendModal }) {
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' | 'transactions'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'settled'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'gave' | 'took'
  const [friendFilter, setFriendFilter] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [sumRes, ledRes, txRes] = await Promise.all([
        api.get('/friends/summary'),
        api.get('/friends/ledger'),
        api.get('/friends')
      ]);

      setSummary(sumRes.data.summary);
      setLedger(ledRes.data.ledger || []);
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      console.error('Failed to load friends page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Quick Settle
  const handleToggleSettle = async (id) => {
    try {
      await api.patch(`/friends/${id}/settle`);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transaction.');
    }
  };

  const handleSettleAll = async (name) => {
    if (window.confirm(`Are you sure you want to settle all pending transactions with ${name}?`)) {
      try {
        await api.post('/friends/settle-all', { friend_name: name });
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to settle all.');
      }
    }
  };

  const handleDelete = async (id, name, amount) => {
    if (window.confirm(`Delete record of ₹${amount} with ${name}?`)) {
      try {
        await api.delete(`/friends/${id}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete record.');
      }
    }
  };

  // Filtered transactions
  const filteredTx = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (friendFilter && tx.friend_name.toLowerCase() !== friendFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = tx.friend_name?.toLowerCase().includes(q);
      const matchNote = tx.notes?.toLowerCase().includes(q);
      if (!matchName && !matchNote) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
            <h1 style={{ margin: 0 }}>Friends Ledger</h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              Separate Ledger
            </span>
          </div>
          <p style={{ fontSize: '0.88rem' }}>
            Track money lent to or borrowed from friends — kept completely separate from your daily personal expenses.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={fetchAllData}
            className="btn btn-secondary btn-sm"
            title="Refresh"
            style={{ height: '38px' }}
          >
            <RefreshCw size={14} />
            <span className="desktop-only">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFriendModal ? onOpenFriendModal('add') : null}
            className="btn btn-primary"
            style={{
              height: '38px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              borderColor: '#059669',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <PlusCircle size={17} />
            <span>+ Add Friend Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        {/* Card 1: To Receive */}
        <div className="summary-card" style={{ borderColor: '#bbf7d0' }}>
          <div className="summary-card-header">
            <span className="summary-card-label" style={{ color: '#166534' }}>To Receive (Lent)</span>
            <div className="summary-card-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="summary-card-value" style={{ color: '#15803d' }}>
            {loading ? '...' : formatINR(summary?.totalLeneHai || 0)}
          </div>
          <div className="summary-card-subtext">
            {summary?.countLeneHai || 0} pending entries (Money lent)
          </div>
        </div>

        {/* Card 2: To Pay */}
        <div className="summary-card" style={{ borderColor: '#fecaca' }}>
          <div className="summary-card-header">
            <span className="summary-card-label" style={{ color: '#991b1b' }}>To Pay (Borrowed)</span>
            <div className="summary-card-icon-wrap" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="summary-card-value" style={{ color: '#b91c1c' }}>
            {loading ? '...' : formatINR(summary?.totalDeneHai || 0)}
          </div>
          <div className="summary-card-subtext">
            {summary?.countDeneHai || 0} pending entries (Money borrowed)
          </div>
        </div>

        {/* Card 3: Net Balance */}
        <div className="summary-card" style={{ borderColor: (summary?.netBalance || 0) >= 0 ? '#bbf7d0' : '#fed7aa' }}>
          <div className="summary-card-header">
            <span className="summary-card-label" style={{ color: (summary?.netBalance || 0) >= 0 ? '#166534' : '#9a3412' }}>
              Net Balance
            </span>
            <div className="summary-card-icon-wrap" style={{
              backgroundColor: (summary?.netBalance || 0) >= 0 ? '#dcfce7' : '#ffedd5',
              color: (summary?.netBalance || 0) >= 0 ? '#16a34a' : '#ea580c'
            }}>
              <HandCoins size={18} />
            </div>
          </div>
          <div className="summary-card-value" style={{ color: (summary?.netBalance || 0) >= 0 ? '#15803d' : '#c2410c' }}>
            {loading ? '...' : `${(summary?.netBalance || 0) >= 0 ? '+' : ''}${formatINR(summary?.netBalance || 0)}`}
          </div>
          <div className="summary-card-subtext">
            {(summary?.netBalance || 0) >= 0 ? 'Overall to Receive' : 'Overall to Pay'} ({summary?.uniqueFriends || 0} friends)
          </div>
        </div>

        {/* Card 4: Settled Transactions */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Settled</span>
            <div className="summary-card-icon-wrap" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="summary-card-value">
            {loading ? '...' : formatINR(summary?.totalSettledAmount || 0)}
          </div>
          <div className="summary-card-subtext">
            {summary?.totalSettledCount || 0} transactions settled
          </div>
        </div>
      </div>

      {/* Main Content Card: Switch between Friends Ledger and All Transactions */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`friend-pill-btn ${viewMode === 'ledger' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Friends Ledger ({ledger.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('transactions')}
              className={`friend-pill-btn ${viewMode === 'transactions' ? 'active' : ''}`}
            >
              <Filter size={16} />
              <span>All Transactions ({transactions.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenFriendModal ? onOpenFriendModal('add') : null}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.35rem' }}
          >
            <PlusCircle size={15} />
            <span>Open Friend Popup</span>
          </button>
        </div>

        {/* VIEW 1: FRIENDS LEDGER */}
        {viewMode === 'ledger' && (
          <div style={{ padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : ledger.length === 0 ? (
              <div className="state-box" style={{ margin: '1rem 0' }}>
                <Users size={40} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                <div className="state-box-title">No Friends Recorded Yet</div>
                <div className="state-box-desc">
                  Click "+ Add Friend Transaction" above to record money given to or taken from a friend.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
                {ledger.map((item, idx) => {
                  const isLene = item.netBalance > 0;
                  const isDene = item.netBalance < 0;
                  const isSettled = item.netBalance === 0;

                  return (
                    <div key={idx} className="friend-ledger-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className={`friend-avatar ${isLene ? 'avatar-lene' : (isDene ? 'avatar-dene' : 'avatar-settled')}`}>
                            {item.friend_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                              {item.friend_name}
                            </div>
                            {item.friend_phone && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={11} />
                                <span>{item.friend_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className={`friend-badge ${isLene ? 'badge-lene' : (isDene ? 'badge-dene' : 'badge-settled')}`}>
                          {isLene ? 'To Receive' : (isDene ? 'To Pay' : 'Settled')}
                        </span>
                      </div>

                      {/* Balance breakdown */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        padding: '0.65rem',
                        backgroundColor: 'var(--bg-page)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>Lent (To Receive)</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>
                            {formatINR(item.totalGave)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>Borrowed (To Pay)</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                            {formatINR(item.totalTook)}
                          </div>
                        </div>
                      </div>

                      {/* Footer: Net Balance & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>Net Balance</div>
                          <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: isLene ? '#16a34a' : (isDene ? '#dc2626' : 'var(--text-muted)')
                          }}>
                            {isLene && `+${formatINR(item.netBalance)}`}
                            {isDene && `-${formatINR(Math.abs(item.netBalance))}`}
                            {isSettled && '₹0'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {item.pendingCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSettleAll(item.friend_name)}
                              className="btn btn-secondary btn-sm"
                              style={{ height: '32px', fontSize: '0.8rem', gap: '0.25rem' }}
                            >
                              <Check size={13} />
                              <span>Settle All</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setFriendFilter(item.friend_name);
                              setViewMode('transactions');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ height: '32px', fontSize: '0.8rem' }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TRANSACTIONS LIST */}
        {viewMode === 'transactions' && (
          <div style={{ padding: '1rem' }}>
            {/* Search and Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.1rem', height: '38px', fontSize: '0.86rem' }}
                  placeholder="Search friend name or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {friendFilter && (
                <button
                  type="button"
                  onClick={() => setFriendFilter(null)}
                  className="friend-filter-pill active"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span>Friend: {friendFilter}</span>
                  <span>✕</span>
                </button>
              )}

              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                  className={`friend-filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                >
                  Pending
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter(typeFilter === 'gave' ? 'all' : 'gave')}
                  className={`friend-filter-pill ${typeFilter === 'gave' ? 'active' : ''}`}
                >
                  To Receive (Lent)
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter(typeFilter === 'took' ? 'all' : 'took')}
                  className={`friend-filter-pill ${typeFilter === 'took' ? 'active' : ''}`}
                >
                  To Pay (Borrowed)
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'settled' ? 'all' : 'settled')}
                  className={`friend-filter-pill ${statusFilter === 'settled' ? 'active' : ''}`}
                >
                  Settled
                </button>
              </div>
            </div>

            {/* Transactions items */}
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="state-box" style={{ margin: '1rem 0' }}>
                <div className="state-box-title">No transactions found</div>
                <div className="state-box-desc">Try clearing your search query or filters.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredTx.map(tx => {
                  const isGave = tx.type === 'gave';
                  const isSettled = tx.status === 'settled';

                  return (
                    <div key={tx.id} className={`friend-tx-card ${isSettled ? 'tx-settled' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={`friend-tx-icon-box ${isGave ? 'icon-gave' : 'icon-took'}`}>
                          {isGave ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>{tx.friend_name}</span>
                            <span className={`friend-badge ${isGave ? 'badge-lene' : 'badge-dene'}`} style={{ fontSize: '0.7rem' }}>
                              {isGave ? 'Lent (To Receive)' : 'Borrowed (To Pay)'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                            {tx.notes || (isGave ? 'Money lent to friend' : 'Money borrowed from friend')} • {formatDate(tx.transaction_date)}
                            {tx.friend_phone && ` • ${tx.friend_phone}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: isSettled ? 'var(--text-light)' : (isGave ? 'var(--success)' : 'var(--danger)')
                        }}>
                          {isGave ? '+' : '-'}{formatINR(tx.amount)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSettle(tx.id)}
                            className={`friend-settle-btn ${isSettled ? 'settled' : 'pending'}`}
                          >
                            {isSettled ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Settled</span>
                              </>
                            ) : (
                              <span>Mark Settled</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id, tx.friend_name, tx.amount)}
                            className="btn btn-secondary btn-sm"
                            style={{ height: '26px', padding: '0 0.45rem', border: 'none', color: 'var(--text-light)' }}
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

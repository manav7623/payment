import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  X, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Trash2, 
  Search, 
  Plus, 
  Check, 
  RotateCcw,
  HandCoins,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function FriendModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialTab = 'add',
  selectedFriendName = null
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'add' | 'ledger' | 'history'
  
  // Add Entry Form state
  const [type, setType] = useState('gave'); // 'gave' (Lent - To Receive) | 'took' (Borrowed - To Pay)
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Data state
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [knownFriends, setKnownFriends] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Filters for History Tab
  const [filterType, setFilterType] = useState('all'); // 'all' | 'gave' | 'took'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'settled'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFriendFilter, setActiveFriendFilter] = useState(selectedFriendName || null);

  const quickAmounts = [100, 200, 500, 1000, 2000];
  const quickNotes = [
    'Dinner & Food split',
    'Coffee & Snacks',
    'Fuel / Travel share',
    'Movie ticket advance',
    'Emergency cash transfer',
    'Shopping / Grocery split'
  ];

  // Fetch Summary, Ledger & Transactions
  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      const [sumRes, ledRes, txRes] = await Promise.all([
        api.get('/friends/summary'),
        api.get('/friends/ledger'),
        api.get('/friends')
      ]);

      setSummary(sumRes.data.summary);
      setLedger(ledRes.data.ledger || []);
      setTransactions(txRes.data.transactions || []);
      setKnownFriends(txRes.data.friends || []);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
      if (selectedFriendName) {
        setFriendName(selectedFriendName);
        setActiveFriendFilter(selectedFriendName);
      }
      if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      setFormError('');
    }
  }, [isOpen, selectedFriendName, initialTab]);

  if (!isOpen) return null;

  const handleAddQuickAmount = (delta) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + delta));
  };

  const handleSelectKnownFriend = (friend) => {
    setFriendName(friend.friend_name);
    if (friend.friend_phone) {
      setFriendPhone(friend.friend_phone);
    }
  };

  // Submit new friend transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!friendName.trim()) {
      setFormError('Please enter a friend name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/friends', {
        friend_name: friendName.trim(),
        friend_phone: friendPhone.trim() || null,
        type,
        amount: numAmount,
        transaction_date: transactionDate,
        notes: notes.trim() || null
      });

      // Reset form
      setAmount('');
      setNotes('');
      setFormError('');
      setSubmitting(false);

      if (onSuccess) {
        onSuccess(`Transaction with ${friendName.trim()} recorded successfully!`);
      }

      await fetchAllData();
      setActiveTab('ledger');
    } catch (err) {
      setSubmitting(false);
      setFormError(err.response?.data?.message || 'Failed to record friend transaction.');
    }
  };

  // Toggle Settle
  const handleToggleSettle = async (id, friendNameStr) => {
    try {
      const res = await api.patch(`/friends/${id}/settle`);
      if (onSuccess) {
        onSuccess(res.data.status === 'settled' ? `Transaction with ${friendNameStr} settled!` : 'Marked as pending.');
      }
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transaction.');
    }
  };

  // Settle All for a Friend
  const handleSettleAll = async (name) => {
    if (window.confirm(`Are you sure you want to settle all pending transactions with ${name}?`)) {
      try {
        const res = await api.post('/friends/settle-all', { friend_name: name });
        if (onSuccess) {
          onSuccess(res.data.message || `All balances with ${name} settled!`);
        }
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to settle.');
      }
    }
  };

  // Delete transaction
  const handleDeleteTx = async (id, name, amt) => {
    if (window.confirm(`Delete record of ₹${amt} with ${name}?`)) {
      try {
        await api.delete(`/friends/${id}`);
        if (onSuccess) {
          onSuccess('Record deleted.');
        }
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete record.');
      }
    }
  };

  // Filtered transactions for History Tab
  const filteredTransactions = transactions.filter(tx => {
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (activeFriendFilter && tx.friend_name.toLowerCase() !== activeFriendFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tx.friend_name?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchName && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container friend-modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="modal-drag-handle" />

        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(16, 185, 129, 0.35)'
            }}>
              <HandCoins size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: 0 }}>
                  Friends Ledger
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0'
                }}>
                  Friends
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                Track money lent to or borrowed from friends separately
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', padding: '0.35rem' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Navigation Tabs inside Modal */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-page)',
          padding: '0.35rem 1rem 0'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`friend-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          >
            <Plus size={15} />
            <span>+ Add Transaction</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`friend-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          >
            <Users size={15} />
            <span>Balances</span>
            {summary?.totalPending > 0 && (
              <span className="friend-tab-badge">{summary.totalPending}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`friend-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          >
            <Clock size={15} />
            <span>History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1rem', overflowY: 'auto' }}>
          
          {/* ============================================================
              TAB 1: ADD NEW FRIEND TRANSACTION
              ============================================================ */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {formError && (
                <div className="alert alert-error" style={{ margin: 0, padding: '0.65rem 0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              {/* Transaction Type Big Selector */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>
                  Transaction Type *
                </label>
                <div className="friend-type-selector">
                  {/* Option 1: Money Lent (To Receive) */}
                  <button
                    type="button"
                    onClick={() => setType('gave')}
                    className={`friend-type-card ${type === 'gave' ? 'active-gave' : ''}`}
                  >
                    <div className="friend-type-icon-box gave-box">
                      <ArrowUpRight size={20} />
                    </div>
                    <div>
                      <div className="friend-type-title">Money Lent</div>
                      <div className="friend-type-desc">You gave money (To Receive)</div>
                    </div>
                  </button>

                  {/* Option 2: Money Borrowed (To Pay) */}
                  <button
                    type="button"
                    onClick={() => setType('took')}
                    className={`friend-type-card ${type === 'took' ? 'active-took' : ''}`}
                  >
                    <div className="friend-type-icon-box took-box">
                      <ArrowDownLeft size={20} />
                    </div>
                    <div>
                      <div className="friend-type-title">Money Borrowed</div>
                      <div className="friend-type-desc">You took money (To Pay)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input with Quick Chips */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Amount {type === 'gave' ? 'Lent (To Receive)' : 'Borrowed (To Pay)'} *
                </label>
                <div className="hero-currency-input-wrapper">
                  <span className="hero-currency-symbol">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    placeholder="0.00"
                    className="hero-currency-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="quick-amount-chips" style={{ marginTop: '0.45rem' }}>
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddQuickAmount(amt)}
                      className="quick-amount-chip"
                    >
                      +₹{amt}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="quick-amount-chip"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Friend Name & Suggestions */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Friend's Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Rahul Sharma, Aman Verma, Rohit..."
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                />

                {/* Quick Friend Suggestions if any exist */}
                {knownFriends.length > 0 && (
                  <div style={{ marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginRight: '0.4rem' }}>
                      Recent Friends:
                    </span>
                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                      {knownFriends.slice(0, 6).map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectKnownFriend(f)}
                          className="friend-chip-btn"
                        >
                          {f.friend_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone & Date Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-light)' }} />
                    <input
                      type="tel"
                      className="form-input"
                      style={{ paddingLeft: '2rem' }}
                      placeholder="+91..."
                      value={friendPhone}
                      onChange={(e) => setFriendPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-light)' }} />
                    <input
                      type="date"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2rem' }}
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Reason / Notes & Quick Chips */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Reason / Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dinner split, movie tickets, travel..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                  {quickNotes.map((note, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNotes(note)}
                      className="friend-chip-btn"
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-full"
                style={{
                  height: '46px',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  background: type === 'gave' 
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                    : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  boxShadow: type === 'gave'
                    ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                    : '0 4px 14px rgba(239, 68, 68, 0.35)'
                }}
              >
                {submitting ? 'Saving...' : `Save Record (${type === 'gave' ? 'To Receive' : 'To Pay'})`}
              </button>
            </form>
          )}

          {/* ============================================================
              TAB 2: FRIENDS LEDGER / BALANCES
              ============================================================ */}
          {activeTab === 'ledger' && (
            <div>
              {/* 3 Summary Badges */}
              <div className="friend-summary-strip">
                <div className="friend-stat-box lene-box">
                  <div className="friend-stat-label">To Receive (Lent)</div>
                  <div className="friend-stat-val text-success">
                    {formatINR(summary?.totalLeneHai || 0)}
                  </div>
                  <div className="friend-stat-sub">{summary?.countLeneHai || 0} entries</div>
                </div>

                <div className="friend-stat-box dene-box">
                  <div className="friend-stat-label">To Pay (Borrowed)</div>
                  <div className="friend-stat-val text-danger">
                    {formatINR(summary?.totalDeneHai || 0)}
                  </div>
                  <div className="friend-stat-sub">{summary?.countDeneHai || 0} entries</div>
                </div>

                <div className="friend-stat-box net-box">
                  <div className="friend-stat-label">Net Balance</div>
                  <div className={`friend-stat-val ${(summary?.netBalance || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {(summary?.netBalance || 0) >= 0 ? '+' : ''}{formatINR(summary?.netBalance || 0)}
                  </div>
                  <div className="friend-stat-sub">
                    {(summary?.netBalance || 0) >= 0 ? 'Net Receivable' : 'Net Payable'}
                  </div>
                </div>
              </div>

              {/* Friends List */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    Friends Balances ({ledger.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.8rem', gap: '0.3rem' }}
                  >
                    <Plus size={14} />
                    <span>+ Add Record</span>
                  </button>
                </div>

                {loadingData ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </div>
                ) : ledger.length === 0 ? (
                  <div className="state-box" style={{ margin: 0, padding: '2rem' }}>
                    <Users size={36} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                    <div className="state-box-title">No friend records yet</div>
                    <div className="state-box-desc">
                      Record money lent to or borrowed from friends to keep balances organized.
                    </div>
                  </div>
                ) : (
                  <div className="friend-card-list">
                    {ledger.map((item, idx) => {
                      const isLene = item.netBalance > 0;
                      const isDene = item.netBalance < 0;
                      const isSettled = item.netBalance === 0;

                      return (
                        <div key={idx} className="friend-ledger-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            {/* Initials Avatar */}
                            <div className={`friend-avatar ${isLene ? 'avatar-lene' : (isDene ? 'avatar-dene' : 'avatar-settled')}`}>
                              {item.friend_name.substring(0, 2).toUpperCase()}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="truncate">{item.friend_name}</span>
                                {item.friend_phone && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400 }}>
                                    ({item.friend_phone})
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                {item.pendingCount > 0 ? (
                                  <span>{item.pendingCount} pending transaction{item.pendingCount > 1 ? 's' : ''}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>All settled</span>
                                )}
                                {item.lastDate && (
                                  <span>• Last: {formatDate(item.lastDate)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Balance & Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '1.05rem',
                              color: isLene ? 'var(--success)' : (isDene ? 'var(--danger)' : 'var(--text-muted)')
                            }}>
                              {isLene && `+${formatINR(item.netBalance)}`}
                              {isDene && `-${formatINR(Math.abs(item.netBalance))}`}
                              {isSettled && '₹0'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className={`friend-badge ${isLene ? 'badge-lene' : (isDene ? 'badge-dene' : 'badge-settled')}`}>
                                {isLene ? 'To Receive' : (isDene ? 'To Pay' : 'Settled')}
                              </span>

                              {item.pendingCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSettleAll(item.friend_name)}
                                  className="btn btn-secondary btn-sm friend-action-btn"
                                  title="Mark all settled with this friend"
                                >
                                  <Check size={12} />
                                  <span>Settle All</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveFriendFilter(item.friend_name);
                                  setActiveTab('history');
                                }}
                                className="btn btn-secondary btn-sm friend-action-btn"
                                title="View history with this friend"
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
            </div>
          )}

          {/* ============================================================
              TAB 3: TRANSACTION HISTORY
              ============================================================ */}
          {activeTab === 'history' && (
            <div>
              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.1rem', height: '38px', fontSize: '0.86rem' }}
                    placeholder="Search by friend name or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                  {activeFriendFilter && (
                    <button
                      type="button"
                      onClick={() => setActiveFriendFilter(null)}
                      className="friend-filter-pill active"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>Friend: {activeFriendFilter}</span>
                      <X size={12} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setFilterStatus('all'); setFilterType('all'); }}
                    className={`friend-filter-pill ${filterStatus === 'all' && filterType === 'all' ? 'active' : ''}`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
                    className={`friend-filter-pill ${filterStatus === 'pending' ? 'active' : ''}`}
                  >
                    Pending ({summary?.totalPending || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterType(filterType === 'gave' ? 'all' : 'gave')}
                    className={`friend-filter-pill ${filterType === 'gave' ? 'active' : ''}`}
                  >
                    Lent (To Receive)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterType(filterType === 'took' ? 'all' : 'took')}
                    className={`friend-filter-pill ${filterType === 'took' ? 'active' : ''}`}
                  >
                    Borrowed (To Pay)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus(filterStatus === 'settled' ? 'all' : 'settled')}
                    className={`friend-filter-pill ${filterStatus === 'settled' ? 'active' : ''}`}
                  >
                    Settled ({summary?.totalSettledCount || 0})
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              {loadingData ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="state-box" style={{ margin: 0, padding: '2rem' }}>
                  <div className="state-box-title">No transactions match your filter</div>
                  <div className="state-box-desc">Try clearing filters or search to view more records.</div>
                </div>
              ) : (
                <div className="friend-tx-list">
                  {filteredTransactions.map((tx) => {
                    const isGave = tx.type === 'gave';
                    const isSettled = tx.status === 'settled';

                    return (
                      <div key={tx.id} className={`friend-tx-card ${isSettled ? 'tx-settled' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className={`friend-tx-icon-box ${isGave ? 'icon-gave' : 'icon-took'}`}>
                            {isGave ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </div>

                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{tx.friend_name}</span>
                              <span className={`friend-badge ${isGave ? 'badge-lene' : 'badge-dene'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                                {isGave ? 'Lent' : 'Borrowed'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
                              {tx.notes || (isGave ? 'Money lent to friend' : 'Money borrowed from friend')} • {formatDate(tx.transaction_date)}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Amount & Settle action */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isSettled ? 'var(--text-light)' : (isGave ? 'var(--success)' : 'var(--danger)')
                          }}>
                            {isGave ? '+' : '-'}{formatINR(tx.amount)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isSettled ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSettle(tx.id, tx.friend_name)}
                                className="friend-settle-btn settled"
                                title="Reopen to pending"
                              >
                                <CheckCircle2 size={12} />
                                <span>Settled</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSettle(tx.id, tx.friend_name)}
                                className="friend-settle-btn pending"
                                title="Mark as settled"
                              >
                                <span>Mark as Settled</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteTx(tx.id, tx.friend_name, tx.amount)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.45rem', height: '24px', border: 'none', color: 'var(--text-light)' }}
                              title="Delete record"
                            >
                              <Trash2 size={13} />
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
    </div>
  );
}

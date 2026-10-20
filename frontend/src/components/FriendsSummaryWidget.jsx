import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { formatINR } from '../utils/formatters';
import { HandCoins, ArrowUpRight, ArrowDownLeft, Users, ChevronRight, PlusCircle } from 'lucide-react';

export default function FriendsSummaryWidget({ onOpenFriendModal }) {
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, ledRes] = await Promise.all([
        api.get('/friends/summary'),
        api.get('/friends/ledger')
      ]);
      setSummary(sumRes.data.summary);
      setLedger(ledRes.data.ledger || []);
    } catch (err) {
      console.error('Failed to load friends widget summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLeneHai = summary?.totalLeneHai || 0;
  const totalDeneHai = summary?.totalDeneHai || 0;
  const netBalance = summary?.netBalance || 0;
  const pendingCount = summary?.totalPending || 0;

  // Active friends with non-zero balance
  const activeFriends = ledger.filter(f => f.netBalance !== 0).slice(0, 4);

  return (
    <div className="card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
      {/* Widget Header */}
      <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)'
          }}>
            <HandCoins size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.08rem' }}>
                Friends Ledger
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.12rem 0.45rem',
                borderRadius: '9999px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}>
                Separate Balances
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: 0 }}>
              Track money lent to or borrowed from friends separately
            </p>
          </div>
        </div>

        {/* Action Button: Opens the Friend popup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onOpenFriendModal ? onOpenFriendModal('add') : null}
            className="btn btn-primary btn-sm"
            style={{
              height: '34px',
              padding: '0 0.85rem',
              fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              borderColor: '#059669',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Add Record</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFriendModal ? onOpenFriendModal('ledger') : null}
            className="btn btn-secondary btn-sm"
            style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.82rem' }}
          >
            <Users size={15} />
            <span className="desktop-only">Balances</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
        padding: '0 1.25rem 1rem'
      }}>
        {/* Card 1: To Receive (Lent) */}
        <div 
          onClick={() => onOpenFriendModal ? onOpenFriendModal('history') : null}
          className="friend-widget-stat-card"
          style={{
            backgroundColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>
              To Receive (Lent)
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatINR(totalLeneHai)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '0.15rem' }}>
            {summary?.countLeneHai || 0} active lent record{summary?.countLeneHai > 1 ? 's' : ''}
          </div>
        </div>

        {/* Card 2: To Pay (Borrowed) */}
        <div 
          onClick={() => onOpenFriendModal ? onOpenFriendModal('history') : null}
          className="friend-widget-stat-card"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#991b1b' }}>
              To Pay (Borrowed)
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatINR(totalDeneHai)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: '0.15rem' }}>
            {summary?.countDeneHai || 0} active borrowed record{summary?.countDeneHai > 1 ? 's' : ''}
          </div>
        </div>

        {/* Card 3: Net Balance */}
        <div 
          onClick={() => onOpenFriendModal ? onOpenFriendModal('ledger') : null}
          className="friend-widget-stat-card"
          style={{
            backgroundColor: netBalance >= 0 ? '#f0fdf4' : '#fff7ed',
            borderColor: netBalance >= 0 ? '#bbf7d0' : '#fed7aa',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: netBalance >= 0 ? '#166534' : '#9a3412' }}>
              Net Balance
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: netBalance >= 0 ? '#dcfce7' : '#ffedd5',
              color: netBalance >= 0 ? '#16a34a' : '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: netBalance >= 0 ? '#15803d' : '#c2410c',
            letterSpacing: '-0.02em'
          }}>
            {loading ? '...' : `${netBalance >= 0 ? '+' : ''}${formatINR(netBalance)}`}
          </div>
          <div style={{ fontSize: '0.74rem', color: netBalance >= 0 ? '#166534' : '#9a3412', marginTop: '0.15rem' }}>
            {netBalance >= 0 ? 'Net Receivable' : 'Net Payable'} ({pendingCount} pending)
          </div>
        </div>
      </div>

      {/* Active Friends Quick Bar (if any) */}
      {activeFriends.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border-light)',
          padding: '0.75rem 1.25rem',
          backgroundColor: '#fafbfc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' }}>
              Top Friends:
            </span>
            {activeFriends.map((f, i) => {
              const isLene = f.netBalance > 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onOpenFriendModal ? onOpenFriendModal('ledger', f.friend_name) : null}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <span>{f.friend_name}</span>
                  <span style={{ color: isLene ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {isLene ? `+${formatINR(f.netBalance)}` : `-${formatINR(Math.abs(f.netBalance))}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenFriendModal ? onOpenFriendModal('ledger') : null}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
          >
            <span>Open Friends Ledger</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

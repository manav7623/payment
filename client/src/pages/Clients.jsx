import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { formatINR } from '../utils/formatters';
import { Users, UserPlus, Search, Mail, Phone, MapPin, Receipt, CalendarClock } from 'lucide-react';
import CreateClientModal from '../components/CreateClientModal';

export default function Clients({ onSelectClientForPayment, onSelectClientForPlan }) {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const totalClients = clients.length;
  const totalCollected = clients.reduce((acc, c) => acc + parseFloat(c.total_paid || 0), 0);
  const totalPending = clients.reduce((acc, c) => acc + parseFloat(c.pending_amount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Client Management</h1>
          <p style={{ fontSize: '0.88rem' }}>
            Register new clients, view accounts, and track payment histories.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={17} />
            <span>New Client</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="summary-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="summary-card">
          <span className="summary-card-label">Total Clients</span>
          <div className="summary-card-value">{totalClients}</div>
          <span className="summary-card-subtext">Active payer accounts</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">Total Revenue</span>
          <div className="summary-card-value" style={{ color: 'var(--success)' }}>
            {formatINR(totalCollected)}
          </div>
          <span className="summary-card-subtext">Verified payments collected</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">Pending Verification</span>
          <div className="summary-card-value" style={{ color: 'var(--warning)' }}>
            {formatINR(totalPending)}
          </div>
          <span className="summary-card-subtext">Awaiting admin review</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.4rem' }}
          placeholder="Search by client name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading clients...</div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="state-box">
          <Users size={32} className="state-box-icon" />
          <div className="state-box-title">No clients found</div>
          <div className="state-box-desc">
            {searchTerm ? 'No clients match your search term.' : 'Click "New Client" to create your first client account.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filteredClients.map((client) => (
            <div key={client.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{client.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={13} />
                      <span>{client.email}</span>
                    </div>
                  </div>
                  <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {client.status}
                  </span>
                </div>

                {client.phone && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                    <Phone size={13} />
                    <span>{client.phone}</span>
                  </div>
                )}

                {client.address && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                    <MapPin size={13} />
                    <span>{client.address}</span>
                  </div>
                )}

                {/* Financial overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  padding: '0.65rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  margin: '0.75rem 0'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', display: 'block' }}>Total Paid</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--success)' }}>{formatINR(client.total_paid)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', display: 'block' }}>Pending</span>
                    <strong style={{ fontSize: '0.95rem', color: client.pending_amount > 0 ? 'var(--warning)' : 'var(--text-light)' }}>
                      {formatINR(client.pending_amount)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => onSelectClientForPayment(client.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.78rem' }}
                >
                  <Receipt size={13} />
                  <span>Add Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectClientForPlan(client.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.78rem' }}
                >
                  <CalendarClock size={13} />
                  <span>Assign Plan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}

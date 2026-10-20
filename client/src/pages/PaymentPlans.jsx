import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate, getStatusBadge } from '../utils/formatters';
import { CalendarClock, PlusCircle, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, CreditCard, Trash2 } from 'lucide-react';
import CreatePlanModal from '../components/CreatePlanModal';

export default function PaymentPlans({ onPayInstallment }) {
  const { user, isAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data.plans || []);
      // Auto expand first plan if exists
      if (res.data.plans && res.data.plans.length > 0 && !expandedPlanId) {
        setExpandedPlanId(res.data.plans[0].id);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    if (isAdmin) {
      api.get('/clients')
        .then(res => setClients(res.data.clients || []))
        .catch(err => console.error('Failed to load clients:', err));
    }
  }, [isAdmin]);

  const toggleExpand = (planId) => {
    setExpandedPlanId(prev => (prev === planId ? null : planId));
  };

  const handleDeletePlan = async (planId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this payment plan?')) {
      try {
        await api.delete(`/plans/${planId}`);
        fetchPlans();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete plan.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Payment Plans & Installments</h1>
          <p style={{ fontSize: '0.88rem' }}>
            {isAdmin 
              ? 'Manage long-term contracts, installments, and schedule due dates.' 
              : 'Track your payment milestones, remaining balance, and upcoming due dates.'}
          </p>
        </div>

        {isAdmin && (
          <div className="page-header-actions">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={17} />
              <span>Create Plan</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading payment plans...</div>
        </div>
      ) : plans.length === 0 ? (
        <div className="state-box">
          <CalendarClock size={32} className="state-box-icon" />
          <div className="state-box-title">No payment plans found</div>
          <div className="state-box-desc">
            {isAdmin 
              ? 'Click "Create Plan" to assign a new installment plan to a client.'
              : 'You do not have any active installment plans at this time.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const progress = Math.min(100, Math.round((parseFloat(plan.total_paid) / parseFloat(plan.total_amount)) * 100));

            return (
              <div key={plan.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Plan Header Card */}
                <div 
                  onClick={() => toggleExpand(plan.id)}
                  style={{ 
                    padding: '1rem 1.25rem', 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    backgroundColor: isExpanded ? 'var(--bg-subtle)' : '#ffffff',
                    borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {plan.title}
                      </h3>
                      {isAdmin && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                          Client: <strong>{plan.client_name}</strong> ({plan.client_email})
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePlan(plan.id, e)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}
                          title="Delete Plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', border: 'none' }}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Total Amount</span>
                      <strong style={{ fontSize: '1rem' }}>{formatINR(plan.total_amount)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Total Paid</span>
                      <strong style={{ color: 'var(--success)', fontSize: '1rem' }}>{formatINR(plan.total_paid)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Remaining</span>
                      <strong style={{ color: plan.remaining_amount > 0 ? 'var(--warning)' : 'var(--text-light)', fontSize: '1rem' }}>
                        {formatINR(plan.remaining_amount)}
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-light)' }}>{plan.installments_count} Installments Schedule</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{progress}% Paid</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress >= 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Expanded Installments List */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem', color: 'var(--text-muted)' }}>
                      Scheduled Installments Breakdown
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {plan.installments?.map((inst) => {
                        const badge = getStatusBadge(inst.status);
                        const isPayable = inst.status === 'unpaid' || inst.status === 'partially_paid' || inst.status === 'overdue';
                        const remainingToPay = Math.max(0, parseFloat(inst.amount) - parseFloat(inst.paid_amount));

                        return (
                          <div 
                            key={inst.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: inst.status === 'paid' ? 'var(--success-bg)' : '#ffffff',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                backgroundColor: 'var(--bg-subtle)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}>
                                #{inst.installment_number}
                              </span>

                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {formatINR(inst.amount)}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                  Due Date: <strong>{formatDate(inst.due_date)}</strong>
                                  {inst.paid_amount > 0 && inst.status !== 'paid' && (
                                    <span style={{ color: 'var(--success)', marginLeft: '0.35rem' }}>
                                      (Paid: {formatINR(inst.paid_amount)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={`badge ${badge.className}`}>
                                {badge.label}
                              </span>

                              {isPayable && onPayInstallment && (
                                <button
                                  type="button"
                                  onClick={() => onPayInstallment({
                                    clientId: plan.client_id,
                                    planId: plan.id,
                                    installmentId: inst.id,
                                    amount: remainingToPay
                                  })}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.3rem 0.65rem', height: '30px' }}
                                >
                                  <CreditCard size={13} />
                                  <span>Pay Installment</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Plan Creation Modal */}
      {isAdmin && (
        <CreatePlanModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={fetchPlans}
          clients={clients}
        />
      )}
    </div>
  );
}

import React from 'react';
import { formatINR, formatDate, getStatusBadge } from '../utils/formatters';
import { ChevronRight, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function PaymentCard({ payment, onViewDetails, showClient = false }) {
  const badge = getStatusBadge(payment.status);

  return (
    <div className="tx-card" onClick={() => onViewDetails(payment)}>
      <div className="tx-card-top">
        <div>
          <div className="tx-card-amount">
            {formatINR(payment.amount)}
          </div>
          <div className="tx-card-date">
            {formatDate(payment.payment_date)}
          </div>
        </div>
        <span className={`badge ${badge.className}`}>
          {payment.status === 'verified' && <CheckCircle2 size={12} style={{ marginRight: '2px' }} />}
          {payment.status === 'pending' && <Clock size={12} style={{ marginRight: '2px' }} />}
          {badge.label}
        </span>
      </div>

      <div className="tx-card-middle">
        <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
          {payment.category}
          {showClient && payment.client_name && (
            <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: '0.4rem' }}>
              • {payment.client_name}
            </span>
          )}
        </div>
        <div className="tx-card-meta">
          <span>{payment.payment_method}</span>
        </div>
      </div>

      <div className="tx-card-bottom">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          {payment.reference_id ? `Ref: ${payment.reference_id}` : (payment.notes || 'No reference note')}
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(payment);
          }}
        >
          <span>Details</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

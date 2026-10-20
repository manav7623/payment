import React from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { ChevronRight, FileCheck, Tag, CreditCard } from 'lucide-react';

export default function ExpenseCard({ expense, onViewDetails }) {
  return (
    <div className="tx-card" onClick={() => onViewDetails(expense)}>
      <div className="tx-card-top">
        <div style={{ flex: 1, marginRight: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
            {expense.title}
          </div>
          <div className="tx-card-date">
            {formatDate(expense.expense_date)}
          </div>
        </div>
        <div className="tx-card-amount" style={{ color: 'var(--primary)' }}>
          {formatINR(expense.amount)}
        </div>
      </div>

      <div className="tx-card-middle">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
          <span className="badge badge-neutral" style={{ fontWeight: 500 }}>
            <Tag size={11} style={{ marginRight: '2px' }} />
            {expense.category}
          </span>
          {expense.receipt_url && (
            <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
              <FileCheck size={11} style={{ marginRight: '2px' }} />
              Bill
            </span>
          )}
        </div>

        <div className="tx-card-meta" style={{ fontSize: '0.82rem' }}>
          <CreditCard size={13} style={{ marginRight: '2px' }} />
          <span>{expense.payment_method}</span>
        </div>
      </div>

      <div className="tx-card-bottom">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
          {expense.notes || 'No extra notes'}
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(expense);
          }}
        >
          <span>Details</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

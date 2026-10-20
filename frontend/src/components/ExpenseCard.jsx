import React from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { getCategoryTheme, getPaymentMethodTheme } from '../utils/categoryTheme';
import { FileCheck, ChevronRight } from 'lucide-react';

export default function ExpenseCard({ expense, onViewDetails }) {
  const categoryTheme = getCategoryTheme(expense.category);
  const CategoryIcon = categoryTheme.icon;
  const paymentTheme = getPaymentMethodTheme(expense.payment_method);
  const PaymentIcon = paymentTheme.icon;

  return (
    <div className="tx-card" onClick={() => onViewDetails(expense)}>
      {/* Category Icon Avatar */}
      <div 
        className="tx-card-icon-avatar"
        style={{
          backgroundColor: categoryTheme.bg,
          color: categoryTheme.color,
          border: `1px solid ${categoryTheme.border}`
        }}
      >
        <CategoryIcon size={20} />
      </div>

      {/* Expense Info */}
      <div className="tx-card-content">
        <div className="tx-card-title">
          {expense.title}
        </div>

        <div className="tx-card-meta-line">
          <span>{formatDate(expense.expense_date)}</span>
          <span style={{ color: 'var(--border-input)' }}>•</span>
          <span 
            className="tx-card-meta-pill"
            style={{ 
              backgroundColor: paymentTheme.bg, 
              color: paymentTheme.color 
            }}
          >
            <PaymentIcon size={11} />
            <span>{expense.payment_method}</span>
          </span>

          {expense.notes && (
            <>
              <span style={{ color: 'var(--border-input)' }}>•</span>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {expense.notes}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Amount & Receipt */}
      <div className="tx-card-right">
        <div className="tx-card-amount-val">
          -{formatINR(expense.amount)}
        </div>

        {expense.receipt_url ? (
          <span className="tx-card-receipt-indicator" title="Receipt attached">
            <FileCheck size={11} />
            <span>Bill</span>
          </span>
        ) : (
          <ChevronRight size={15} style={{ color: 'var(--text-light)', opacity: 0.7 }} />
        )}
      </div>
    </div>
  );
}

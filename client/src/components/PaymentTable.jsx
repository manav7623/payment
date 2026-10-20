import React from 'react';
import { formatINR, formatDate, getStatusBadge } from '../utils/formatters';
import { Eye, FileCheck, Check, X } from 'lucide-react';

export default function PaymentTable({ 
  payments, 
  onViewDetails, 
  onVerify, 
  onReject, 
  showClient = false,
  isAdmin = false 
}) {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            {showClient && <th>Client</th>}
            <th>Amount</th>
            <th>Date</th>
            <th>Category</th>
            <th>Method</th>
            <th>Reference ID</th>
            <th>Status</th>
            <th>Receipt</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const badge = getStatusBadge(p.status);
            return (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                  #{p.id}
                </td>
                {showClient && (
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.client_name || 'Client'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{p.client_email}</div>
                  </td>
                )}
                <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {formatINR(p.amount)}
                </td>
                <td>{formatDate(p.payment_date)}</td>
                <td>
                  <span style={{ fontSize: '0.85rem' }}>{p.category}</span>
                </td>
                <td>{p.payment_method}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {p.reference_id || '-'}
                </td>
                <td>
                  <span className={`badge ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td>
                  {p.receipt_url ? (
                    <span 
                      style={{ color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                      onClick={() => onViewDetails(p)}
                      title="View Receipt"
                    >
                      <FileCheck size={16} />
                      <span>Attached</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>None</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => onViewDetails(p)}
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    {isAdmin && p.status === 'pending' && onVerify && (
                      <button
                        type="button"
                        onClick={() => onVerify(p.id)}
                        className="btn btn-success btn-sm"
                        title="Verify Payment"
                        style={{ padding: '0.35rem 0.5rem' }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {isAdmin && p.status === 'pending' && onReject && (
                      <button
                        type="button"
                        onClick={() => onReject(p)}
                        className="btn btn-danger btn-sm"
                        title="Reject Payment"
                        style={{ padding: '0.35rem 0.5rem' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

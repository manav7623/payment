import React, { useState } from 'react';
import { formatINR, formatDate, formatDateTime, getStatusBadge } from '../utils/formatters';
import { X, Check, AlertTriangle, FileText, Download, ExternalLink, Trash2 } from 'lucide-react';

export default function PaymentDetailModal({ 
  payment, 
  onClose, 
  onVerify, 
  onReject, 
  onDelete, 
  isAdmin 
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!payment) return null;

  const badge = getStatusBadge(payment.status);
  const receiptFullUrl = payment.receipt_url || null;
  const isImageReceipt = payment.receipt_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(payment.receipt_url);

  const handleVerify = async () => {
    setActionLoading(true);
    await onVerify(payment.id);
    setActionLoading(false);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    await onReject(payment.id, rejectReason);
    setActionLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Payment Details</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Transaction #{payment.id}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', padding: '0.3rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Amount & Status banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.15rem' }}>
                Payment Amount
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {formatINR(payment.amount)}
              </div>
            </div>
            <span className={`badge ${badge.className}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.65rem' }}>
              {badge.label}
            </span>
          </div>

          {/* Rejection notice if rejected */}
          {payment.status === 'rejected' && payment.rejection_reason && (
            <div className="alert alert-error">
              <div>
                <strong>Rejection Reason:</strong> {payment.rejection_reason}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Payment Date</div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{formatDate(payment.payment_date)}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Category</div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{payment.category}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Payment Method</div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{payment.payment_method}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Reference ID / UTR</div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{payment.reference_id || 'Not provided'}</div>
            </div>

            {isAdmin && payment.client_name && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Client</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {payment.client_name} ({payment.client_email})
                  {payment.client_phone && ` • ${payment.client_phone}`}
                </div>
              </div>
            )}

            {payment.plan_title && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Linked Payment Plan</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {payment.plan_title}
                  {payment.installment_number && ` (Installment #${payment.installment_number})`}
                </div>
              </div>
            )}

            {payment.notes && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Notes</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{payment.notes}</div>
              </div>
            )}

            {payment.verified_at && (
              <div style={{ gridColumn: 'span 2', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                Verified on {formatDateTime(payment.verified_at)}
                {payment.verifier_name && ` by ${payment.verifier_name}`}
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Payment Receipt</span>
              {receiptFullUrl && (
                <a 
                  href={receiptFullUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', height: '26px', padding: '0.2rem 0.5rem' }}
                >
                  <Download size={13} />
                  <span>Open Full File</span>
                </a>
              )}
            </div>

            {receiptFullUrl ? (
              isImageReceipt ? (
                <div style={{ 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-light)', 
                  overflow: 'hidden',
                  textAlign: 'center',
                  maxHeight: '220px',
                  backgroundColor: '#fafafa'
                }}>
                  <img 
                    src={receiptFullUrl} 
                    alt="Receipt" 
                    style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} 
                  />
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <FileText size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>PDF Receipt Document</div>
                    <a href={receiptFullUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem' }}>
                      Click to view PDF
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                No receipt uploaded for this transaction.
              </div>
            )}
          </div>

          {/* Admin Verification Actions */}
          {isAdmin && payment.status === 'pending' && (
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Admin Actions
              </div>

              {!isRejecting ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="btn btn-success"
                    style={{ flex: 1 }}
                  >
                    <Check size={16} />
                    <span>Verify & Approve Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    disabled={actionLoading}
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                  >
                    <X size={16} />
                    <span>Reject Payment</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRejectSubmit}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--danger)' }}>
                      Rejection Reason (Required)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Transaction ID invalid, amount mismatch, etc."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn btn-danger btn-sm"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this payment record?')) {
                  onDelete(payment.id);
                }
              }}
              className="btn btn-danger btn-sm"
              style={{ marginRight: 'auto' }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

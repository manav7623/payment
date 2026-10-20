import React from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { Eye, FileCheck, Edit2, Trash2 } from 'lucide-react';

export default function ExpenseTable({ 
  expenses, 
  onViewDetails, 
  onEdit, 
  onDelete 
}) {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Category</th>
            <th>Method</th>
            <th>Receipt</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                #{exp.id}
              </td>
              <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                {exp.title}
              </td>
              <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>
                {formatINR(exp.amount)}
              </td>
              <td>{formatDate(exp.expense_date)}</td>
              <td>
                <span className="badge badge-neutral">
                  {exp.category}
                </span>
              </td>
              <td>{exp.payment_method}</td>
              <td>
                {exp.receipt_url ? (
                  <span 
                    style={{ color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                    onClick={() => onViewDetails(exp)}
                    title="View Attached Receipt"
                  >
                    <FileCheck size={15} />
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
                    onClick={() => onViewDetails(exp)}
                    className="btn btn-secondary btn-sm"
                    title="View Full Details"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(exp)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Expense"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(exp.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete Expense"
                      style={{ padding: '0.35rem 0.5rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

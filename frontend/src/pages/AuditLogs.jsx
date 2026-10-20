import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { formatDateTime } from '../utils/formatters';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Audit Logs</h1>
          <p style={{ fontSize: '0.88rem' }}>
            System-level audit trail of all logins, payment submissions, verifications, and plan creations.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={fetchLogs}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading security logs...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="state-box">
          <ShieldCheck size={32} className="state-box-icon" />
          <div className="state-box-title">No audit records found</div>
          <div className="state-box-desc">All system events will be recorded here.</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {log.user_name || 'System'}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Tag, Plus, Trash2, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await api.post('/categories', {
        name: name.trim(),
        color
      });
      setName('');
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Expense Categories</h1>
          <p style={{ fontSize: '0.88rem' }}>
            Manage spending categories for organizing your personal expenses.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={17} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-box" style={{ border: 'none' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div className="state-box-desc">Loading categories...</div>
        </div>
      ) : categories.length === 0 ? (
        <div className="state-box">
          <Tag size={32} className="state-box-icon" />
          <div className="state-box-title">No categories found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                margin: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: cat.color || 'var(--primary)',
                  display: 'inline-block'
                }}></span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                    {cat.is_default ? 'System Default' : 'Custom Category'}
                  </div>
                </div>
              </div>

              {!cat.is_default && (
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.3rem', color: 'var(--danger)', border: 'none' }}
                  title="Delete Category"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Create Category</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ border: 'none', padding: '0.3rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Subscriptions, Travel, Gym"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color Indicator</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ width: '42px', height: '36px', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Selected: <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 4px', borderRadius: '4px' }}>{color}</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

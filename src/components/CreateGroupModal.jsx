import { useEffect, useMemo, useState } from 'react';

export default function CreateGroupModal({ users, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onClose?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, submitting]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Group name must be at least 2 characters');
      return;
    }
    if (selected.size < 1) {
      setError('Pick at least one member');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), memberIds: [...selected] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  }

  const memberCount = selected.size + 1;

  return (
    <div
      className="create-group-overlay"
      role="presentation"
      onClick={() => !submitting && onClose?.()}
    >
      <form
        className="create-group-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="create-group-modal-header">
          <div className="create-group-modal-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="create-group-modal-heading">
            <h2 id="create-group-title">Create group</h2>
            <p>Name your group and pick who to include.</p>
          </div>
          <button
            type="button"
            className="create-group-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="create-group-field">
          <label className="create-group-label" htmlFor="group-name">
            Group name
          </label>
          <input
            id="group-name"
            className="create-group-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project team"
            minLength={2}
            required
            autoFocus
            disabled={submitting}
          />
        </div>

        <div className="create-group-field">
          <div className="create-group-label-row">
            <label className="create-group-label" htmlFor="group-member-search">
              Members
            </label>
            <span className="create-group-count">
              {selected.size === 0 ? 'None selected' : `${selected.size} selected`}
            </span>
          </div>
          <input
            id="group-member-search"
            className="create-group-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            disabled={submitting}
          />
        </div>

        <div className="member-picker" role="listbox" aria-label="Select members">
          {filtered.map((u) => {
            const id = String(u.id);
            const checked = selected.has(id);
            return (
              <label
                key={id}
                className={`member-picker-item ${checked ? 'selected' : ''}`}
                role="option"
                aria-selected={checked}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(id)}
                  disabled={submitting}
                />
                <span className="avatar tiny">{(u.username || '?').slice(0, 2).toUpperCase()}</span>
                <span className="member-picker-meta">
                  <span className="member-picker-name">{u.username}</span>
                  {u.email && <span className="member-picker-email">{u.email}</span>}
                </span>
                <span className={`member-check ${checked ? 'on' : ''}`} aria-hidden="true">
                  {checked ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </span>
              </label>
            );
          })}
          {filtered.length === 0 && <p className="empty-hint">No matching users</p>}
        </div>

        {error && <div className="auth-error create-group-error">{error}</div>}

        <div className="create-group-actions">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="confirm-btn primary" disabled={submitting || selected.size < 1}>
            {submitting ? 'Creating…' : `Create (${memberCount})`}
          </button>
        </div>
      </form>
    </div>
  );
}

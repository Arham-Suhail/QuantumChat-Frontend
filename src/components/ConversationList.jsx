import { motion } from 'framer-motion';
import { Ban, Users, UserPlus, X } from 'lucide-react';

function isRecentlyActive(iso) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
}

function formatShortLastSeen(iso) {
  if (!iso) return 'never seen';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
];

export default function ConversationList({
  conversations,
  filter,
  onFilterChange,
  selectedKey,
  onSelect,
  onCreateGroup,
  onHide,
  onBlock,
  loading,
  searchQuery = '',
}) {
  return (
    <div className="conversation-panel">
      <div className="sidebar-filters" role="tablist" aria-label="Conversation filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`sidebar-filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => onFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sidebar-create-row">
        <button type="button" className="create-group-btn" onClick={onCreateGroup}>
          <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
          New group
        </button>
      </div>

      {loading ? (
        <div className="user-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="user-list-item" style={{ pointerEvents: 'none' }}>
              <div className="skeleton skeleton-avatar" />
              <div className="skeleton-user-info">
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line medium" style={{ marginTop: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="user-list">
          {conversations.map((c, index) => (
            <motion.div
              key={c.key}
              className={`user-list-item ${c.key === selectedKey ? 'active' : ''} ${c.unread ? 'unread' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(c);
                }
              }}
              aria-label={`${c.type === 'group' ? 'Group' : 'Chat'} ${c.title}${c.unread ? ', unread' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.16) }}
              whileHover={{ y: -1 }}
            >
              <span className={`avatar ${c.type === 'group' ? 'group-avatar' : ''}`}>
                {c.type === 'group' ? (
                  <Users size={18} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <>
                    {(c.title || '?').slice(0, 2).toUpperCase()}
                    {isRecentlyActive(c.lastLoginAt) && <span className="online-dot" />}
                  </>
                )}
              </span>
              <span className="user-list-meta">
                <span className="user-list-name-row">
                  <span className="user-list-name">{c.title}</span>
                  {c.unread && <span className="unread-dot" aria-hidden="true" />}
                </span>
                <span className="user-list-lastseen">{c.subtitle || formatShortLastSeen(c.lastLoginAt)}</span>
              </span>
              {c.type === 'dm' && (onHide || onBlock) && (
                <span className="user-list-actions">
                  {onHide && (
                    <button
                      type="button"
                      className="user-list-action-btn"
                      title="Hide chat"
                      aria-label={`Hide chat with ${c.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onHide(c.peer || c);
                      }}
                    >
                      <X size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                  {onBlock && (
                    <button
                      type="button"
                      className="user-list-action-btn danger"
                      title="Block user"
                      aria-label={`Block ${c.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlock(c.peer || c);
                      }}
                    >
                      <Ban size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </span>
              )}
            </motion.div>
          ))}
          {conversations.length === 0 && (
            <p className="empty-hint">
              {searchQuery.trim()
                ? 'No users or groups match your search.'
                : filter === 'unread'
                  ? 'No unread conversations.'
                  : filter === 'groups'
                    ? 'No groups yet. Create one to get started.'
                    : 'No conversations yet.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function isRecentlyActive(iso) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
}

export default function UserList({ users, selectedUserId, onSelect }) {
  return (
    <div className="user-list">
      {users.map((u) => (
        <button
          key={u.id}
          className={`user-list-item ${u.id === selectedUserId ? 'active' : ''}`}
          onClick={() => onSelect(u)}
        >
          <span className="avatar">
            {u.username.slice(0, 2).toUpperCase()}
            {isRecentlyActive(u.lastLoginAt) && <span className="online-dot" />}
          </span>
          <span className="user-list-meta">
            <span className="user-list-name">{u.username}</span>
          </span>
        </button>
      ))}
      {users.length === 0 && <p className="empty-hint">No other users yet.</p>}
    </div>
  );
}

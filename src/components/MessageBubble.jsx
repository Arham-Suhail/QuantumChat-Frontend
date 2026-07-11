import { useEffect, useRef, useState } from 'react';
import AttachmentBubble from './AttachmentBubble.jsx';
import { QUICK_REACTIONS } from '../utils/emojis.js';

function groupReactions(reactions = []) {
  const map = new Map();
  for (const r of reactions) {
    if (!r?.emoji) continue;
    const entry = map.get(r.emoji) || { emoji: r.emoji, count: 0, users: [] };
    entry.count += 1;
    entry.users.push(String(r.user));
    map.set(r.emoji, entry);
  }
  return [...map.values()];
}

export default function MessageBubble({
  message,
  isMine,
  currentUserId,
  resolveAttachmentKey,
  grouped,
  onDelete,
  onReact,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const rootRef = useRef(null);
  const messageId = message.id || message._id;
  const reactionGroups = groupReactions(message.reactions);
  const myReaction = (message.reactions || []).find((r) => String(r.user) === String(currentUserId))?.emoji;

  useEffect(() => {
    if (!menuOpen && !reactOpen) return undefined;
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) {
        setMenuOpen(false);
        setReactOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen, reactOpen]);

  return (
    <div
      ref={rootRef}
      className={`message-row ${isMine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}
    >
      <div className={`message-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
        <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}>
          {message.attachment && (
            <AttachmentBubble
              attachment={message.attachment}
              isMine={isMine}
              resolveAttachmentKey={resolveAttachmentKey}
            />
          )}
          {message.text ? message.text : message.text === null ? <em>[Unable to decrypt message]</em> : null}
          <div className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</div>
        </div>

        <button
          type="button"
          className="message-more-btn"
          aria-label="Message options"
          onClick={() => {
            setMenuOpen((v) => !v);
            setReactOpen(false);
          }}
        >
          ···
        </button>

        {menuOpen && (
          <div className={`message-menu ${isMine ? 'mine' : 'theirs'}`}>
            <button
              type="button"
              onClick={() => {
                setReactOpen(true);
                setMenuOpen(false);
              }}
            >
              React
            </button>
            {isMine && (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(messageId);
                }}
              >
                Delete for everyone
              </button>
            )}
          </div>
        )}

        {reactOpen && (
          <div className={`reaction-picker ${isMine ? 'mine' : 'theirs'}`}>
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={myReaction === emoji ? 'active' : ''}
                onClick={() => {
                  setReactOpen(false);
                  onReact?.(messageId, emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {reactionGroups.length > 0 && (
        <div className={`message-reactions ${isMine ? 'mine' : 'theirs'}`}>
          {reactionGroups.map((g) => (
            <button
              key={g.emoji}
              type="button"
              className={`reaction-chip ${g.users.includes(String(currentUserId)) ? 'mine' : ''}`}
              onClick={() => onReact?.(messageId, g.emoji)}
              aria-label={`React with ${g.emoji}`}
            >
              <span>{g.emoji}</span>
              {g.count > 1 && <span className="reaction-count">{g.count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

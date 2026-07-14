import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, Pencil, Reply, Smile, Trash2 } from 'lucide-react';
import AttachmentBubble from './AttachmentBubble.jsx';
import { QUICK_REACTIONS } from '../utils/emojis.js';

const MENU_GAP = 8;
const VIEW_PAD = 12;

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

function placePopover(anchorRect, popoverEl, { preferMine }) {
  if (!anchorRect || !popoverEl) return { top: 0, left: 0, placement: 'below' };

  const pop = popoverEl.getBoundingClientRect();
  const header = document.querySelector('.chat-header');
  const topLimit = Math.max(VIEW_PAD, header ? header.getBoundingClientRect().bottom + 6 : VIEW_PAD);
  const bottomLimit = window.innerHeight - VIEW_PAD;
  const spaceAbove = anchorRect.top - topLimit;
  const spaceBelow = bottomLimit - anchorRect.bottom;

  let placement = 'below';
  if (spaceBelow < pop.height + MENU_GAP && spaceAbove > spaceBelow) placement = 'above';
  else if (spaceAbove >= pop.height + MENU_GAP && spaceBelow < pop.height + MENU_GAP) placement = 'above';
  else if (spaceBelow >= pop.height + MENU_GAP) placement = 'below';
  else placement = spaceAbove > spaceBelow ? 'above' : 'below';

  let top =
    placement === 'above' ? anchorRect.top - pop.height - MENU_GAP : anchorRect.bottom + MENU_GAP;
  top = Math.min(Math.max(top, topLimit), bottomLimit - pop.height);

  let left = preferMine ? anchorRect.right - pop.width : anchorRect.left;
  left = Math.min(Math.max(VIEW_PAD, left), window.innerWidth - pop.width - VIEW_PAD);

  return { top, left, placement };
}

export default function MessageBubble({
  message,
  isMine,
  currentUserId,
  resolveSecretKey,
  grouped,
  senderLabel,
  replyPreview,
  onDelete,
  onReact,
  onReply,
  onEdit,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'below', ready: false });
  const rootRef = useRef(null);
  const moreRef = useRef(null);
  const reactBtnRef = useRef(null);
  const popoverRef = useRef(null);
  const anchorRef = useRef(null);
  const messageId = message.id || message._id;
  const reactionGroups = groupReactions(message.reactions);
  const myReaction = (message.reactions || []).find((r) => String(r.user) === String(currentUserId))?.emoji;
  const anyPopover = menuOpen || reactOpen;

  function closeAll() {
    setMenuOpen(false);
    setReactOpen(false);
    setCoords((prev) => ({ ...prev, ready: false }));
  }

  function updatePlacement() {
    const anchor = anchorRef.current?.getBoundingClientRect();
    const next = placePopover(anchor, popoverRef.current, { preferMine: isMine });
    setCoords({ ...next, ready: true });
  }

  useLayoutEffect(() => {
    if (!anyPopover) {
      setCoords((prev) => ({ ...prev, ready: false }));
      return undefined;
    }
    updatePlacement();
    const id = requestAnimationFrame(updatePlacement);
    return () => cancelAnimationFrame(id);
  }, [anyPopover, menuOpen, reactOpen, isMine]);

  useEffect(() => {
    if (!anyPopover) return undefined;

    function onDocClick(e) {
      if (rootRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      closeAll();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') closeAll();
    }
    function onReposition() {
      updatePlacement();
    }

    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    const list = document.querySelector('.message-list');
    list?.addEventListener('scroll', onReposition, { passive: true });

    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      list?.removeEventListener('scroll', onReposition);
    };
  }, [anyPopover, isMine]);

  const popover =
    anyPopover &&
    createPortal(
      <div
        ref={popoverRef}
        className={`message-popover ${isMine ? 'mine' : 'theirs'} ${coords.placement} ${coords.ready ? 'ready' : ''}`}
        style={{ top: coords.top, left: coords.left }}
        role={menuOpen ? 'menu' : 'listbox'}
        aria-label={menuOpen ? 'Message options' : 'Pick a reaction'}
      >
        {menuOpen && (
          <>
            {onReply && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeAll();
                  onReply(message);
                }}
              >
                <span className="message-menu-icon" aria-hidden="true">
                  <Reply size={16} strokeWidth={2} />
                </span>
                <span>Reply</span>
              </button>
            )}
            {isMine && onEdit && !message.attachment && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeAll();
                  onEdit(message);
                }}
              >
                <span className="message-menu-icon" aria-hidden="true">
                  <Pencil size={16} strokeWidth={2} />
                </span>
                <span>Edit</span>
              </button>
            )}
            {isMine && onDelete && (
              <button
                type="button"
                className="danger"
                role="menuitem"
                onClick={() => {
                  closeAll();
                  onDelete(messageId);
                }}
              >
                <span className="message-menu-icon" aria-hidden="true">
                  <Trash2 size={16} strokeWidth={2} />
                </span>
                <span>Delete for everyone</span>
              </button>
            )}
          </>
        )}

        {reactOpen && onReact && (
          <div className="reaction-picker-inline">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                aria-selected={myReaction === emoji}
                className={myReaction === emoji ? 'active' : ''}
                onClick={() => {
                  closeAll();
                  onReact(messageId, emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <motion.div
      ref={rootRef}
      className={`message-row ${isMine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''} ${anyPopover ? 'popover-open' : ''}`}
      initial={grouped ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`message-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
        <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}>
          {senderLabel && !isMine && !grouped && <div className="message-sender-label">{senderLabel}</div>}
          {replyPreview && (
            <div className="message-reply-preview">
              <span className="message-reply-label">{replyPreview.label}</span>
              <span className="message-reply-text">{replyPreview.text}</span>
            </div>
          )}
          {message.attachment && (
            <AttachmentBubble
              attachment={message.attachment}
              isMine={isMine}
              resolveSecretKey={resolveSecretKey}
            />
          )}
          {message.text ? message.text : message.text === null ? <em>[Unable to decrypt message]</em> : null}
          <div className="message-time">
            {new Date(message.createdAt).toLocaleTimeString()}
            {message.editedAt ? <span className="message-edited"> · edited</span> : null}
          </div>
        </div>

        <div className="message-action-cluster">
          {onReact && (
            <button
              ref={reactBtnRef}
              type="button"
              className={`message-react-btn ${reactOpen || myReaction ? 'visible' : ''}`}
              aria-label="Add reaction"
              onClick={() => {
                anchorRef.current = reactBtnRef.current;
                setReactOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <Smile size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          <button
            ref={moreRef}
            type="button"
            className={`message-more-btn ${anyPopover ? 'visible' : ''}`}
            aria-label="Message options"
            aria-expanded={anyPopover}
            onClick={() => {
              anchorRef.current = moreRef.current;
              setMenuOpen((v) => !v);
              setReactOpen(false);
            }}
          >
            <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {popover}

      {reactionGroups.length > 0 && (
        <div className={`message-reactions ${isMine ? 'mine' : 'theirs'}`}>
          {reactionGroups.map((g) => (
            <button
              key={g.emoji}
              type="button"
              className={`reaction-chip ${g.users.includes(String(currentUserId)) ? 'mine' : ''}`}
              onClick={() => onReact?.(messageId, g.emoji)}
              aria-label={`React with ${g.emoji}`}
              disabled={!onReact}
            >
              <span>{g.emoji}</span>
              {g.count > 1 && <span className="reaction-count">{g.count}</span>}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

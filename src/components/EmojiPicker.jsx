import { COMPOSER_EMOJIS } from '../utils/emojis.js';

export default function EmojiPicker({ onPick, onClose }) {
  return (
    <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
      <div className="emoji-picker-header">
        <span>Emojis</span>
        <button type="button" className="emoji-picker-close" onClick={onClose} aria-label="Close emoji picker">
          ×
        </button>
      </div>
      <div className="emoji-picker-grid">
        {COMPOSER_EMOJIS.map((emoji) => (
          <button key={emoji} type="button" onClick={() => onPick(emoji)} aria-label={`Insert ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import client from '../api/client.js';
import { unsealBytes } from '../crypto/keys.js';
import { attachmentIdOf, normalizeAttachment, pickAttachmentEnvelope } from '../crypto/voiceCache.js';

function FileIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function MicIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function isAudioAttachment(attachment) {
  const mime = attachment?.mimetype || '';
  const name = (attachment?.filename || '').toLowerCase();
  return mime.startsWith('audio/') || /\.(webm|ogg|mp3|m4a|wav|aac)$/i.test(name) || /^voice-note/i.test(name);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function VoicePlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [url]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="voice-player">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button type="button" className="voice-play-btn" onClick={togglePlay} aria-label={playing ? 'Pause voice note' : 'Play voice note'}>
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
      </button>
      <div className="voice-wave">
        <div className="voice-wave-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
      <span className="voice-duration">{formatDuration(duration)}</span>
    </div>
  );
}

export default function AttachmentBubble({ attachment: rawAttachment, isMine, resolveSecretKey }) {
  const attachment = normalizeAttachment(rawAttachment);
  const [status, setStatus] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audio = isAudioAttachment(attachment);
  const attachmentId = attachmentIdOf(attachment);
  const opened = pickAttachmentEnvelope(attachment, resolveSecretKey);

  useEffect(() => {
    let revoked = null;
    let cancelled = false;

    async function loadVoice() {
      if (!audio || !attachmentId || !opened) return;

      setStatus('loading');
      try {
        const res = await client.get(`/attachments/${attachmentId}/raw`, { responseType: 'arraybuffer' });
        if (cancelled) return;
        const plainBytes = unsealBytes(new Uint8Array(res.data), opened.envelope, opened.secretKey);
        if (!plainBytes) {
          setStatus('error');
          return;
        }
        const mime = attachment.mimetype?.startsWith('audio/') ? attachment.mimetype : 'audio/webm';
        const url = URL.createObjectURL(new Blob([plainBytes], { type: mime }));
        revoked = url;
        setAudioUrl(url);
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    loadVoice();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [
    audio,
    attachmentId,
    opened?.secretKey,
    opened?.envelope?.nonce,
    opened?.envelope?.targetPublicKey,
    attachment?.mimetype,
  ]);

  if (!attachment) return null;

  if (audioUrl) {
    return <VoicePlayer url={audioUrl} />;
  }

  if (!opened && audio) {
    return (
      <div className="attachment-chip attachment-chip-disabled">
        <span className="attachment-filename">
          <MicIcon className="file-icon" />
          <span>Voice note</span>
        </span>
        <span className="attachment-note">
          {status === 'loading' ? 'Decrypting…' : isMine ? "can't decrypt on this device" : "can't decrypt on this device"}
        </span>
      </div>
    );
  }

  if (!opened) {
    return (
      <div className="attachment-chip attachment-chip-disabled">
        <span className="attachment-filename">
          <FileIcon className="file-icon" />
          <span>{attachment.filename}</span>
        </span>
        <span className="attachment-note">can't decrypt on this device</span>
      </div>
    );
  }

  async function handleFetch() {
    setStatus('loading');
    try {
      const res = await client.get(`/attachments/${attachmentId}/raw`, { responseType: 'arraybuffer' });
      const plainBytes = unsealBytes(new Uint8Array(res.data), opened.envelope, opened.secretKey);
      if (!plainBytes) {
        setStatus('error');
        return;
      }

      const mime = attachment.mimetype || 'application/octet-stream';
      const blob = new Blob([plainBytes], { type: mime });
      const url = URL.createObjectURL(blob);

      if (audio || mime.startsWith('audio/')) {
        setAudioUrl(url);
        setStatus('idle');
      } else if (mime.startsWith('image/')) {
        setPreview(url);
        setStatus('idle');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.filename;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('idle');
      }
    } catch {
      setStatus('error');
    }
  }

  if (preview) {
    return <img className="attachment-preview" src={preview} alt={attachment.filename} />;
  }

  if (status === 'loading' && (audio || attachment.mimetype?.startsWith('image/'))) {
    return audio ? (
      <div className="attachment-chip attachment-chip-voice">
        <span className="attachment-filename">
          <MicIcon className="file-icon" />
          <span>Decrypting voice note…</span>
        </span>
      </div>
    ) : (
      <div className="skeleton attachment-preview-placeholder" />
    );
  }

  return (
    <div className={`attachment-chip ${audio ? 'attachment-chip-voice' : ''}`}>
      <span className="attachment-filename">
        {audio ? <MicIcon className="file-icon" /> : <FileIcon className="file-icon" />}
        <span>{audio ? 'Voice note' : attachment.filename}</span>
      </span>
      <button type="button" onClick={handleFetch} disabled={status === 'loading'}>
        {status === 'loading' ? 'Decrypting…' : status === 'error' ? 'Failed — retry' : audio ? 'Play' : 'Open'}
      </button>
    </div>
  );
}

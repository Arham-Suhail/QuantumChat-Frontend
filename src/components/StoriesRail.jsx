import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client.js';
import { getToken } from '../crypto/keyStorage.js';
import UserAvatar from './UserAvatar.jsx';

const MAX_STORY_SECONDS = 60;
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

function probeMediaDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const el = document.createElement(isVideo ? 'video' : 'audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const durationMs = Math.round((el.duration || 0) * 1000);
      URL.revokeObjectURL(url);
      resolve(durationMs);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read media duration'));
    };
    el.src = url;
  });
}

export default function StoriesRail({ currentUser, onError }) {
  const [stories, setStories] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const story of stories) {
      const uid = String(story.user?.id || story.user);
      if (!map.has(uid)) {
        map.set(uid, {
          user: story.user,
          items: [],
        });
      }
      map.get(uid).items.push(story);
    }
    // Put current user first
    const list = [...map.values()];
    list.sort((a, b) => {
      const aMe = String(a.user?.id) === String(currentUser?.id);
      const bMe = String(b.user?.id) === String(currentUser?.id);
      if (aMe !== bMe) return aMe ? -1 : 1;
      return new Date(b.items[0].createdAt) - new Date(a.items[0].createdAt);
    });
    return list;
  }, [stories, currentUser]);

  async function loadStories() {
    try {
      const { data } = await client.get('/stories');
      setStories(data.data || []);
    } catch (err) {
      onError?.(err.response?.data?.error || 'Failed to load stories');
    }
  }

  useEffect(() => {
    loadStories();
    const id = setInterval(loadStories, 30000);
    return () => clearInterval(id);
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      let durationMs = 0;
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        durationMs = await probeMediaDuration(file);
        if (durationMs > MAX_STORY_SECONDS * 1000) {
          onError?.(`Stories must be ${MAX_STORY_SECONDS} seconds or shorter`);
          return;
        }
      }
      const form = new FormData();
      form.append('file', file);
      form.append('durationMs', String(durationMs));
      await client.post('/stories', form);
      await loadStories();
    } catch (err) {
      onError?.(err.response?.data?.error || err.message || 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stories-rail">
      <button
        type="button"
        className="story-ring add"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Add story"
      >
        <UserAvatar
          userId={currentUser?.id}
          name={currentUser?.username}
          hasAvatar={currentUser?.hasAvatar}
          size="story"
        />
        <span className="story-add-badge">+</span>
        <span className="story-ring-label">{uploading ? 'Uploading…' : 'Your story'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        hidden
        onChange={handleFile}
      />

      {grouped
        .filter((g) => String(g.user?.id) !== String(currentUser?.id) || g.items.length > 0)
        .map((g) => (
          <button
            key={String(g.user?.id)}
            type="button"
            className="story-ring"
            onClick={() => setViewer({ group: g, index: 0 })}
          >
            <UserAvatar
              userId={g.user?.id}
              name={g.user?.username}
              hasAvatar={g.user?.hasAvatar}
              size="story"
            />
            <span className="story-ring-label">{g.user?.username}</span>
          </button>
        ))}

      {viewer && (
        <StoryViewer
          group={viewer.group}
          startIndex={viewer.index}
          currentUserId={currentUser?.id}
          onClose={() => setViewer(null)}
          onDeleted={async () => {
            setViewer(null);
            await loadStories();
          }}
        />
      )}
    </div>
  );
}

function StoryViewer({ group, startIndex, currentUserId, onClose, onDeleted }) {
  const [index, setIndex] = useState(startIndex || 0);
  const [mediaUrl, setMediaUrl] = useState(null);
  const story = group.items[index];

  useEffect(() => {
    let cancelled = false;
    let objectUrl;
    setMediaUrl(null);
    (async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/stories/${story.id}/media`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load story media');
      const blob = await res.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setMediaUrl(objectUrl);
    })().catch(() => {
      if (!cancelled) setMediaUrl(null);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [story?.id]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(group.items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [group.items.length, onClose]);

  async function handleDelete() {
    if (!window.confirm('Delete this story?')) return;
    await client.delete(`/stories/${story.id}`);
    onDeleted?.();
  }

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="story-viewer-top">
          <div className="story-viewer-user">
            <UserAvatar
              userId={group.user?.id}
              name={group.user?.username}
              hasAvatar={group.user?.hasAvatar}
              size="sm"
            />
            <span>{group.user?.username}</span>
          </div>
          <button type="button" className="create-group-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="story-viewer-progress">
          {group.items.map((s, i) => (
            <span key={s.id} className={i <= index ? 'on' : ''} />
          ))}
        </div>
        <div
          className="story-viewer-media"
          onClick={() => setIndex((i) => (i < group.items.length - 1 ? i + 1 : (onClose(), i)))}
        >
          {!mediaUrl && <p className="empty-hint">Loading…</p>}
          {mediaUrl && story.mediaType === 'image' && <img src={mediaUrl} alt="" />}
          {mediaUrl && story.mediaType === 'video' && <video src={mediaUrl} autoPlay controls />}
          {mediaUrl && story.mediaType === 'audio' && <audio src={mediaUrl} autoPlay controls />}
        </div>
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <div className="story-viewer-actions">
          {String(group.user?.id) === String(currentUserId) && (
            <button type="button" className="confirm-btn danger" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

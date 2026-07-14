import { useEffect, useState } from 'react';
import client from '../api/client.js';

const cache = new Map();

export function avatarUrlFor(userId) {
  if (!userId) return null;
  return `/users/${userId}/avatar`;
}

export default function UserAvatar({ userId, name, hasAvatar, className = '', size = 'md' }) {
  const [src, setSrc] = useState(() => (hasAvatar && userId ? cache.get(String(userId)) : null));
  const initials = (name || '?').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!hasAvatar || !userId) {
      setSrc(null);
      return undefined;
    }
    const key = String(userId);
    if (cache.has(key)) {
      setSrc(cache.get(key));
      return undefined;
    }
    let cancelled = false;
    client
      .get(avatarUrlFor(userId), { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        const url = URL.createObjectURL(res.data);
        cache.set(key, url);
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, hasAvatar]);

  return (
    <span className={`avatar user-avatar ${size} ${className}`.trim()}>
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}

export function bustAvatarCache(userId) {
  const key = String(userId);
  const old = cache.get(key);
  if (old) URL.revokeObjectURL(old);
  cache.delete(key);
}

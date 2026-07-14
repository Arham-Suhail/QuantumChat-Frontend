const READ_PREFIX = 'qc_read_';
const ACTIVITY_PREFIX = 'qc_activity_';

function readKey(userId, conversationKey) {
  return `${READ_PREFIX}${userId}_${conversationKey}`;
}

function activityKey(userId, conversationKey) {
  return `${ACTIVITY_PREFIX}${userId}_${conversationKey}`;
}

export function conversationKeyForUser(peerId) {
  return `dm:${peerId}`;
}

export function conversationKeyForGroup(groupId) {
  return `group:${groupId}`;
}

export function getLastReadAt(userId, conversationKey) {
  try {
    return localStorage.getItem(readKey(userId, conversationKey)) || null;
  } catch {
    return null;
  }
}

export function markConversationRead(userId, conversationKey, iso = new Date().toISOString()) {
  try {
    localStorage.setItem(readKey(userId, conversationKey), iso);
  } catch {
    // ignore quota
  }
}

export function setConversationActivity(userId, conversationKey, { at, from } = {}) {
  if (!at) return;
  try {
    localStorage.setItem(activityKey(userId, conversationKey), JSON.stringify({ at, from: from || null }));
  } catch {
    // ignore quota
  }
}

export function getConversationActivity(userId, conversationKey) {
  try {
    const raw = localStorage.getItem(activityKey(userId, conversationKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.at) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isUnreadConversation(userId, conversationKey, lastActivityIso, lastFromId) {
  if (!lastActivityIso) return false;
  if (lastFromId && String(lastFromId) === String(userId)) return false;
  const readAt = getLastReadAt(userId, conversationKey);
  if (!readAt) return true;
  return new Date(lastActivityIso).getTime() > new Date(readAt).getTime();
}

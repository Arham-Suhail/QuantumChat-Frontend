import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';
import { connectSocket, getSocket } from '../api/socket.js';
import { sealMessage, unsealMessage, sealBytes, pickRandom } from '../crypto/keys.js';
import { parseKeyFile } from '../crypto/keyFile.js';
import { getCurrentKeySet, findSecretKeyForPublicKey } from '../crypto/keyStorage.js';
import { cacheVoiceNote, normalizeAttachment, pickRecorderMimeType } from '../crypto/voiceCache.js';
import { playReceiveSound, playSendSound } from '../utils/sounds.js';
import UserList from '../components/UserList.jsx';
import MessageBubble from '../components/MessageBubble.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';

const MAX_VOICE_SECONDS = 60;

function formatLastSeen(iso) {
  if (!iso) return 'never logged in';
  return `last seen ${new Date(iso).toLocaleString()}`;
}

function formatVoiceTimer(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Chat() {
  const { user, logout, regenerateKeys, importKeys, hasLocalKeyring } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [importError, setImportError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const keyFileInputRef = useRef(null);
  const selectedUserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordStartedAtRef = useRef(0);
  selectedUserRef.current = selectedUser;

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messageListRef.current) {
      const el = messageListRef.current;
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }
    setHasUnread(false);
  }, []);

  // Track scroll position of message list to toggle unread message bubble helper
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;
    const el = messageListRef.current;
    const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 150;
    if (!isUp) {
      setHasUnread(false);
    }
  }, []);

  // Every sealed-box envelope names the public key it was sealed to
  // (targetPublicKey). Opening it just means finding that key's private
  // half in the local keyring — a public key never appears here, because
  // unsealing structurally requires a private key (see crypto/keys.js).
  const resolveMySecretKey = useCallback((targetPublicKeyHex) => findSecretKeyForPublicKey(user.id, targetPublicKeyHex), [user]);

  const decorate = useCallback(
    (raw) => {
      const isMine = String(raw.from) === String(user.id);
      const envelope = isMine ? raw.forSender : raw.forRecipient;
      if (!envelope?.targetPublicKey) {
        return { ...raw, id: raw.id || raw._id, attachment: normalizeAttachment(raw.attachment), text: null };
      }
      const mySecretKey = resolveMySecretKey(envelope.targetPublicKey);
      const text = mySecretKey ? unsealMessage(envelope, mySecretKey) : null;
      return {
        ...raw,
        id: raw.id || raw._id,
        attachment: normalizeAttachment(raw.attachment),
        text,
      };
    },
    [user, resolveMySecretKey]
  );

  useEffect(() => {
    if (!hasLocalKeyring) return;
    setLoadingUsers(true);
    client
      .get('/users')
      .then((res) => setUsers(res.data.data))
      .finally(() => setLoadingUsers(false));
  }, [hasLocalKeyring]);

  useEffect(() => {
    if (!hasLocalKeyring) return;
    connectSocket();
    const socket = getSocket();
    if (!socket) return undefined;

    function handleIncoming(raw) {
      const current = selectedUserRef.current;
      const otherId = String(raw.from) === String(user.id) ? raw.to : raw.from;
      if (!current || String(current.id) !== String(otherId)) return;

      if (String(raw.from) !== String(user.id)) {
        playReceiveSound();
      }

      setMessages((prev) => {
        const id = String(raw.id || raw._id);
        if (prev.some((m) => String(m.id || m._id) === id)) return prev;
        const next = [...prev, decorate(raw)];

        if (messageListRef.current) {
          const el = messageListRef.current;
          const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 150;
          if (isUp) {
            setHasUnread(true);
          } else {
            setTimeout(() => scrollToBottom('smooth'), 50);
          }
        }
        return next;
      });
    }

    function handleDeleted(payload) {
      const id = String(payload?.id || '');
      if (!id) return;
      setMessages((prev) => prev.filter((m) => String(m.id || m._id) !== id));
    }

    function handleReaction(raw) {
      const id = String(raw?.id || raw?._id || '');
      if (!id) return;
      const current = selectedUserRef.current;
      const otherId = String(raw.from) === String(user.id) ? raw.to : raw.from;
      if (!current || String(current.id) !== String(otherId)) return;
      setMessages((prev) => prev.map((m) => (String(m.id || m._id) === id ? decorate(raw) : m)));
    }

    socket.on('message:new', handleIncoming);
    socket.on('message:deleted', handleDeleted);
    socket.on('message:reaction', handleReaction);
    return () => {
      socket.off('message:new', handleIncoming);
      socket.off('message:deleted', handleDeleted);
      socket.off('message:reaction', handleReaction);
    };
  }, [hasLocalKeyring, user, decorate, scrollToBottom]);

  // Socket.IO gives instant delivery where it's available (local dev), but
  // the deployed backend runs serverless (Vercel) and has no socket server
  // at all — without this, a new message only ever showed up after a full
  // page reload. Polling is a blunt fallback, but it works everywhere.
  useEffect(() => {
    if (!selectedUser || !hasLocalKeyring) return undefined;

    let cancelled = false;
    let firstLoad = true;
    const fetchMessages = () => {
      if (firstLoad) setLoadingMessages(true);
      client
        .get(`/messages/${selectedUser.id}`)
        .then((res) => {
          if (cancelled) return;
          const next = res.data.data.map(decorate);
          // Skip the state update (and the auto-scroll-to-bottom it triggers)
          // when polling turns up nothing new — otherwise re-reading history
          // gets yanked back to the bottom every 3 seconds.
          setMessages((prev) => {
            const same =
              prev.length === next.length &&
              prev.every((m, i) => (m.id || m._id) === (next[i].id || next[i]._id));
            if (!same && !firstLoad) {
              const prevIds = new Set(prev.map((m) => String(m.id || m._id)));
              const hasNewIncoming = next.some(
                (m) => !prevIds.has(String(m.id || m._id)) && String(m.from) !== String(user.id)
              );
              if (hasNewIncoming) playReceiveSound();
            }
            return same ? prev : next;
          });
          if (firstLoad) {
            setTimeout(() => scrollToBottom('auto'), 50);
          }
        })
        .finally(() => {
          if (firstLoad) {
            setLoadingMessages(false);
            firstLoad = false;
          }
        });
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedUser, hasLocalKeyring, decorate, scrollToBottom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canChat = hasLocalKeyring;

  function handleSelectUser(u) {
    setSelectedUser(u);
    setSidebarOpen(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !selectedUser) return;
    try {
      // Both sides pick a random key from the target's current 5-key pool —
      // this conversation's ciphertext ends up spread across multiple keys
      // instead of always the same one.
      const myKey = pickRandom(getCurrentKeySet(user.id));
      const recipientKeys = (selectedUser.publicKeys || []).filter(Boolean);
      if (!myKey?.publicKey || recipientKeys.length === 0) {
        setError('Missing encryption keys for this conversation');
        return;
      }
      const recipientPublicKey = pickRandom(recipientKeys);
      // Sealed twice: once to the recipient (so they can read it), once to
      // my own key (so I can read my own sent history back — the ephemeral
      // key from either seal is discarded right after sealing).
      const forRecipient = sealMessage(draft, recipientPublicKey);
      const forSender = sealMessage(draft, myKey.publicKey);
      const { data } = await client.post('/messages', { to: selectedUser.id, forRecipient, forSender });
      setMessages((prev) => [...prev, decorate(data.data)]);
      setDraft('');
      playSendSound();
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  }

  async function sendAttachmentFile(file, { plainBytes, cacheAsVoice } = {}) {
    if (!file || !selectedUser) return;
    const myKey = pickRandom(getCurrentKeySet(user.id));
    const recipientKeys = (selectedUser.publicKeys || []).filter(Boolean);
    if (!myKey?.publicKey || recipientKeys.length === 0) {
      setError('Missing encryption keys for this conversation');
      return;
    }
    const recipientPublicKey = pickRandom(recipientKeys);
    const fileBytes = plainBytes || new Uint8Array(await file.arrayBuffer());
    // Attachments are sealed to the recipient only (not doubled like text)
    // to avoid uploading every file twice — the sender keeps their own
    // copy locally, so they don't need a server-side readable copy too.
    const sealed = sealBytes(fileBytes, recipientPublicKey);

    const formData = new FormData();
    formData.append('file', new Blob([sealed.cipherBytes], { type: file.type || 'application/octet-stream' }), file.name);
    formData.append('recipientId', selectedUser.id);
    formData.append('nonce', sealed.nonce);
    formData.append('ephemeralPublicKey', sealed.ephemeralPublicKey);
    formData.append('targetPublicKey', sealed.targetPublicKey);
    const uploadRes = await client.post('/attachments', formData);
    const attachmentId = uploadRes.data.data.id;

    if (cacheAsVoice) {
      cacheVoiceNote(attachmentId, { bytes: fileBytes, mimetype: file.type || 'audio/webm' });
    }

    const forRecipient = sealMessage('', recipientPublicKey);
    const forSender = sealMessage('', myKey.publicKey);
    const { data } = await client.post('/messages', {
      to: selectedUser.id,
      forRecipient,
      forSender,
      attachmentId,
    });
    setMessages((prev) => [...prev, decorate(data.data)]);
    playSendSound();
    setTimeout(() => scrollToBottom('smooth'), 50);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedUser) return;
    try {
      await sendAttachmentFile(file);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send attachment');
    }
  }

  function clearRecordingResources({ keepChunks = false } = {}) {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    if (!keepChunks) recordChunksRef.current = [];
    setRecordSeconds(0);
    setRecording(false);
  }

  async function startVoiceRecording() {
    if (!selectedUser || recording || sendingVoice) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice notes are not supported in this browser');
      return;
    }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];
      recordStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) recordChunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        clearRecordingResources();
        setError('Voice recording failed');
      };

      recorder.onstop = async () => {
        const chunks = recordChunksRef.current.slice();
        const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0];
        clearRecordingResources();
        if (!chunks.length) {
          setError('No audio captured — try again');
          return;
        }

        const blob = new Blob(chunks, { type: type || 'audio/webm' });
        if (blob.size < 256) {
          setError('Recording too short — hold a bit longer');
          return;
        }

        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: type || 'audio/webm' });
        const plainBytes = new Uint8Array(await blob.arrayBuffer());

        setSendingVoice(true);
        try {
          await sendAttachmentFile(file, { plainBytes, cacheAsVoice: true });
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to send voice note');
        } finally {
          setSendingVoice(false);
        }
      };

      recorder.start(200);
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartedAtRef.current) / 1000);
        setRecordSeconds(elapsed);
        if (elapsed >= MAX_VOICE_SECONDS) {
          stopVoiceRecording();
        }
      }, 200);
    } catch {
      clearRecordingResources();
      setError('Microphone permission is required for voice notes');
    }
  }

  function stopVoiceRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      clearRecordingResources();
      return;
    }
    try {
      if (recorder.state === 'recording') recorder.requestData();
    } catch {
      // some browsers throw if requestData isn't supported mid-stream
    }
    recorder.stop();
  }

  function cancelVoiceRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = () => clearRecordingResources();
      try {
        recorder.stop();
      } catch {
        clearRecordingResources();
      }
      return;
    }
    clearRecordingResources();
  }

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleDeleteMessage(messageId) {
    if (!messageId) return;
    const confirmed = window.confirm('Delete this message for everyone? It will disappear for both of you with no trace.');
    if (!confirmed) return;
    try {
      await client.delete(`/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => String(m.id || m._id) !== String(messageId)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  }

  async function handleReactMessage(messageId, emoji) {
    if (!messageId || !emoji) return;
    try {
      const { data } = await client.post(`/messages/${messageId}/reactions`, { emoji });
      const updated = decorate(data.data);
      setMessages((prev) => prev.map((m) => (String(m.id || m._id) === String(messageId) ? updated : m)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add reaction');
    }
  }

  function insertEmoji(emoji) {
    setDraft((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  }

  async function handleGenerateKeys() {
    await regenerateKeys();
    setError('');
  }

  async function handleImportKeyFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const secretKeys = parseKeyFile(text);
      importKeys(secretKeys);
      setImportError('');
    } catch (err) {
      setImportError(err.message || 'Failed to import keys.txt');
    }
  }

  const title = useMemo(() => selectedUser?.username || 'Select a conversation', [selectedUser]);
  const filteredUsers = useMemo(
    () => users.filter((u) => u?.username?.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  return (
    <div className="chat-page">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user.username}</div>
              <div className="sidebar-lastseen">{formatLastSeen(user.lastLoginAt)}</div>
            </div>
          </div>
          <button className="link-button" onClick={logout} aria-label="Log out of application">
            Log out
          </button>
        </div>
        {canChat && (
          <div className="sidebar-search">
            <input placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users list" />
          </div>
        )}
        {canChat ? (
          <UserList
            users={filteredUsers}
            selectedUserId={selectedUser?.id}
            onSelect={handleSelectUser}
            loading={loadingUsers}
          />
        ) : (
          <p className="empty-hint">Set up your device key to see people.</p>
        )}
      </aside>

      <main className="chat-main">
        {!canChat && (
          <div className="key-warning">
            <p>
              No private keys found on this device. Either you cleared local storage or this is a new device.
              If you saved a keys.txt backup when you signed up, import it to keep reading your existing
              messages. Otherwise you can generate a fresh 5-key set, but old messages will stay unreadable.
            </p>
            {importError && <div className="auth-error">{importError}</div>}
            <div className="key-warning-actions">
              <button onClick={() => keyFileInputRef.current?.click()}>Import keys.txt</button>
              <input ref={keyFileInputRef} type="file" accept=".txt" hidden onChange={handleImportKeyFile} />
              <button className="secondary-button" onClick={handleGenerateKeys}>
                Generate new keys instead
              </button>
            </div>
          </div>
        )}

        {canChat && (
          <>
            <header className="chat-header">
              <div className="chat-header-left">
                <button
                  className="mobile-menu-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open conversation sidebar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <span>{title}</span>
              </div>
              {selectedUser && <span className="last-seen-badge">{formatLastSeen(selectedUser.lastLoginAt)}</span>}
            </header>

            {!selectedUser ? (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2>No conversation selected</h2>
                <p>Choose a person from the sidebar to start chatting</p>
              </div>
            ) : (
              <>
                <div
                  className="message-list"
                  ref={messageListRef}
                  onScroll={handleScroll}
                >
                  {loadingMessages ? (
                    <>
                      <div className="skeleton-message-bubble theirs skeleton" />
                      <div className="skeleton-message-bubble mine skeleton" />
                      <div className="skeleton-message-bubble theirs skeleton" style={{ width: '45%' }} />
                      <div className="skeleton-message-bubble mine skeleton" style={{ width: '35%' }} />
                    </>
                  ) : (
                    messages.map((m, index) => {
                      const prev = messages[index - 1];
                      // Message is grouped if sent by same user within 2 minutes of the previous message
                      const isGrouped =
                        prev &&
                        String(prev.from) === String(m.from) &&
                        new Date(m.createdAt) - new Date(prev.createdAt) < 120000;

                      return (
                        <MessageBubble
                          key={m.id || m._id}
                          message={m}
                          isMine={String(m.from) === String(user.id)}
                          currentUserId={user.id}
                          resolveAttachmentKey={(attachment) =>
                            resolveMySecretKey(attachment.targetPublicKey)
                          }
                          grouped={isGrouped}
                          onDelete={handleDeleteMessage}
                          onReact={handleReactMessage}
                        />
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {hasUnread && (
                  <button
                    className="scroll-bottom-pill"
                    onClick={() => scrollToBottom('smooth')}
                    aria-label="Scroll to bottom to view new messages"
                  >
                    <span>New messages</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  </button>
                )}

                {error && <div className="auth-error">{error}</div>}

                {recording ? (
                  <div className="composer composer-recording">
                    <button
                      type="button"
                      className="attach-button voice-cancel-btn"
                      onClick={cancelVoiceRecording}
                      aria-label="Cancel voice note"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div className="voice-recording-status">
                      <span className="voice-recording-dot" />
                      <span>Recording {formatVoiceTimer(recordSeconds)}</span>
                      <span className="voice-recording-hint">max {MAX_VOICE_SECONDS}s</span>
                    </div>
                    <button
                      type="button"
                      className="send-button voice-stop-btn"
                      onClick={stopVoiceRecording}
                      aria-label="Send voice note"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="composer-shell">
                    {showEmojiPicker && (
                      <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmojiPicker(false)} />
                    )}
                    <form className="composer" onSubmit={handleSend}>
                      <button
                        type="button"
                        className="attach-button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file to message"
                        disabled={sendingVoice}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`attach-button ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        aria-label="Open emoji picker"
                        disabled={sendingVoice}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                          <line x1="9" y1="9" x2="9.01" y2="9" />
                          <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                      </button>
                      <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
                      <input
                        placeholder={sendingVoice ? 'Sending voice note…' : 'Type an encrypted message…'}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        aria-label="Type message body"
                        disabled={sendingVoice}
                      />
                      {draft.trim() ? (
                        <button type="submit" className="send-button" aria-label="Send encrypted message" disabled={sendingVoice}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="send-button voice-mic-btn"
                          onClick={startVoiceRecording}
                          aria-label="Record voice note"
                          disabled={sendingVoice}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

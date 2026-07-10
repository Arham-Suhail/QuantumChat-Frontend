import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';
import { connectSocket, getSocket } from '../api/socket.js';
import { sealMessage, unsealMessage, sealBytes, pickRandom } from '../crypto/keys.js';
import { parseKeyFile } from '../crypto/keyFile.js';
import { getCurrentKeySet, findSecretKeyForPublicKey } from '../crypto/keyStorage.js';
import UserList from '../components/UserList.jsx';
import MessageBubble from '../components/MessageBubble.jsx';

function formatLastSeen(iso) {
  if (!iso) return 'never logged in';
  return `last seen ${new Date(iso).toLocaleString()}`;
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
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const keyFileInputRef = useRef(null);
  const selectedUserRef = useRef(null);
  selectedUserRef.current = selectedUser;

  // Every sealed-box envelope names the public key it was sealed to
  // (targetPublicKey). Opening it just means finding that key's private
  // half in the local keyring — a public key never appears here, because
  // unsealing structurally requires a private key (see crypto/keys.js).
  const resolveMySecretKey = useCallback((targetPublicKeyHex) => findSecretKeyForPublicKey(user.id, targetPublicKeyHex), [user]);

  const decorate = useCallback(
    (raw) => {
      const isMine = raw.from === user.id;
      const envelope = isMine ? raw.forSender : raw.forRecipient;
      const mySecretKey = resolveMySecretKey(envelope.targetPublicKey);
      const text = mySecretKey ? unsealMessage(envelope, mySecretKey) : null;
      return { ...raw, text };
    },
    [user, resolveMySecretKey]
  );

  useEffect(() => {
    if (!hasLocalKeyring) return;
    client.get('/users').then((res) => setUsers(res.data.data));
  }, [hasLocalKeyring]);

  useEffect(() => {
    if (!hasLocalKeyring) return;
    connectSocket();
    const socket = getSocket();

    function handleIncoming(raw) {
      const current = selectedUserRef.current;
      const otherId = raw.from === user.id ? raw.to : raw.from;
      if (!current || current.id !== otherId) return;
      setMessages((prev) => [...prev, decorate(raw)]);
    }

    socket.on('message:new', handleIncoming);
    return () => socket.off('message:new', handleIncoming);
  }, [hasLocalKeyring, user, decorate]);

  useEffect(() => {
    if (!selectedUser || !hasLocalKeyring) return;
    client.get(`/messages/${selectedUser.id}`).then((res) => {
      setMessages(res.data.data.map(decorate));
    });
  }, [selectedUser, hasLocalKeyring, decorate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canChat = hasLocalKeyring;

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !selectedUser) return;
    try {
      // Both sides pick a random key from the target's current 5-key pool —
      // this conversation's ciphertext ends up spread across multiple keys
      // instead of always the same one.
      const myKey = pickRandom(getCurrentKeySet(user.id));
      const recipientPublicKey = pickRandom(selectedUser.publicKeys);
      // Sealed twice: once to the recipient (so they can read it), once to
      // my own key (so I can read my own sent history back — the ephemeral
      // key from either seal is discarded right after sealing).
      const forRecipient = sealMessage(draft, recipientPublicKey);
      const forSender = sealMessage(draft, myKey.publicKey);
      const { data } = await client.post('/messages', { to: selectedUser.id, forRecipient, forSender });
      setMessages((prev) => [...prev, decorate(data.data)]);
      setDraft('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedUser) return;
    try {
      const myKey = pickRandom(getCurrentKeySet(user.id));
      const recipientPublicKey = pickRandom(selectedUser.publicKeys);
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      // Attachments are sealed to the recipient only (not doubled like text)
      // to avoid uploading every file twice — the sender keeps their own
      // copy locally, so they don't need a server-side readable copy too.
      const sealed = sealBytes(fileBytes, recipientPublicKey);

      const formData = new FormData();
      formData.append('file', new Blob([sealed.cipherBytes]), file.name);
      formData.append('recipientId', selectedUser.id);
      formData.append('nonce', sealed.nonce);
      formData.append('ephemeralPublicKey', sealed.ephemeralPublicKey);
      formData.append('targetPublicKey', sealed.targetPublicKey);
      const uploadRes = await client.post('/attachments', formData);

      const forRecipient = sealMessage('', recipientPublicKey);
      const forSender = sealMessage('', myKey.publicKey);
      const { data } = await client.post('/messages', {
        to: selectedUser.id,
        forRecipient,
        forSender,
        attachmentId: uploadRes.data.data.id,
      });
      setMessages((prev) => [...prev, decorate(data.data)]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send attachment');
    }
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
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-username">{user.username}</div>
            <div className="sidebar-lastseen">{formatLastSeen(user.lastLoginAt)}</div>
          </div>
          <button className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
        {canChat && (
          <div className="sidebar-search">
            <input placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
        {canChat ? (
          <UserList users={filteredUsers} selectedUserId={selectedUser?.id} onSelect={setSelectedUser} />
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
              <span>{title}</span>
              {selectedUser && <span className="last-seen-badge">{formatLastSeen(selectedUser.lastLoginAt)}</span>}
            </header>
            <div className="message-list">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id || m._id}
                  message={m}
                  isMine={m.from === user.id}
                  resolveAttachmentKey={(attachment) => resolveMySecretKey(attachment.targetPublicKey)}
                />
              ))}
              <div ref={bottomRef} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            {selectedUser && (
              <form className="composer" onSubmit={handleSend}>
                <button type="button" className="attach-button" onClick={() => fileInputRef.current?.click()}>
                  📎
                </button>
                <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
                <input
                  placeholder="Type an encrypted message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}

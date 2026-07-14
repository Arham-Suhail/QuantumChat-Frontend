export function attachmentIdOf(attachmentOrId) {
  if (!attachmentOrId) return null;
  if (typeof attachmentOrId === 'string') return attachmentOrId;
  return attachmentOrId.id != null
    ? String(attachmentOrId.id)
    : attachmentOrId._id != null
      ? String(attachmentOrId._id)
      : null;
}

/** Normalize API attachment docs so the UI always has `id` + envelope fields. */
export function normalizeAttachment(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return { id: raw };
  }
  const id = attachmentIdOf(raw);
  if (!id) return null;
  return {
    ...raw,
    id,
    filename: raw.filename || 'attachment',
    mimetype: raw.mimetype || 'application/octet-stream',
  };
}

/**
 * Pick the sealed-box envelope this device can open for an attachment.
 * Dual-sealed uploads: recipient copy + sender copy (5-key pools).
 */
export function pickAttachmentEnvelope(attachment, resolveSecretKey) {
  if (!attachment || !resolveSecretKey) return null;

  const senderTarget = attachment.forSenderTargetPublicKey;
  if (senderTarget && attachment.forSenderNonce && attachment.forSenderEphemeralPublicKey) {
    const secretKey = resolveSecretKey(senderTarget);
    if (secretKey) {
      return {
        secretKey,
        envelope: {
          nonce: attachment.forSenderNonce,
          ephemeralPublicKey: attachment.forSenderEphemeralPublicKey,
          targetPublicKey: senderTarget,
        },
      };
    }
  }

  if (attachment.targetPublicKey && attachment.nonce && attachment.ephemeralPublicKey) {
    const secretKey = resolveSecretKey(attachment.targetPublicKey);
    if (secretKey) {
      return {
        secretKey,
        envelope: {
          nonce: attachment.nonce,
          ephemeralPublicKey: attachment.ephemeralPublicKey,
          targetPublicKey: attachment.targetPublicKey,
        },
      };
    }
  }

  return null;
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

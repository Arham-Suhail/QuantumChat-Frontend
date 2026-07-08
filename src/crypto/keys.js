import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const { encodeBase64, decodeBase64 } = naclUtil;

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// X25519 keypair: 32-byte public + 32-byte private key, hex-encoded to
// exactly 64 characters each. The private half must never leave the device.
export function generateKeyPair() {
  const { publicKey, secretKey } = nacl.box.keyPair();
  return { publicKey: toHex(publicKey), secretKey: toHex(secretKey) };
}

// Encrypts `plaintext` for `recipientPublicKeyHex` using the sender's own
// secret key. Diffie-Hellman makes the resulting shared key symmetric, so
// the sender can also use this same pairing to decrypt their own sent
// messages later (see decryptMessage).
export function encryptMessage(plaintext, recipientPublicKeyHex, senderSecretKeyHex) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(plaintext);
  const cipher = nacl.box(messageBytes, nonce, fromHex(recipientPublicKeyHex), fromHex(senderSecretKeyHex));
  return { ciphertext: encodeBase64(cipher), nonce: encodeBase64(nonce) };
}

// Decrypts a message exchanged with `otherPartyPublicKeyHex`, regardless of
// whether the current user was the sender or the recipient.
export function decryptMessage(ciphertextB64, nonceB64, otherPartyPublicKeyHex, mySecretKeyHex) {
  const cipher = decodeBase64(ciphertextB64);
  const nonce = decodeBase64(nonceB64);
  const plainBytes = nacl.box.open(cipher, nonce, fromHex(otherPartyPublicKeyHex), fromHex(mySecretKeyHex));
  if (!plainBytes) return null;
  return new TextDecoder().decode(plainBytes);
}

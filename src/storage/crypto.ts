import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToBase64, base64ToBytes } from './base64';

const KEY_STORE_ID = 'introvirght.vaultKey.v1';
const PASSCODE_STORE_ID = 'introvirght.passcodeHash.v1';

let cachedKey: Uint8Array | null = null;

function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.codePointAt(i)!;
    if (code > 0xffff) i++;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      const b1 = bytes[i++];
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      const b1 = bytes[i++];
      const b2 = bytes[i++];
      out += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else {
      const b1 = bytes[i++];
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      let cp = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}

/** The 256-bit content key. Generated once, held only in the platform keystore. */
async function getVaultKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;
  const existing = await SecureStore.getItemAsync(KEY_STORE_ID);
  if (existing) {
    cachedKey = base64ToBytes(existing);
    return cachedKey;
  }
  const fresh = await Crypto.getRandomBytesAsync(32);
  await SecureStore.setItemAsync(KEY_STORE_ID, bytesToBase64(fresh), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  cachedKey = fresh;
  return fresh;
}

export interface Sealed {
  ct: string; // base64 ciphertext+tag
  iv: string; // base64 nonce
}

/** AES-256-GCM encrypt a UTF-8 string. Used for every field written to the local SQLite vault. */
export async function encryptText(plain: string): Promise<Sealed> {
  const key = await getVaultKey();
  const nonce = await Crypto.getRandomBytesAsync(12);
  const cipher = gcm(key, nonce);
  const ct = cipher.encrypt(utf8Encode(plain));
  return { ct: bytesToBase64(ct), iv: bytesToBase64(nonce) };
}

export async function decryptText(sealed: Sealed): Promise<string> {
  const key = await getVaultKey();
  const cipher = gcm(key, base64ToBytes(sealed.iv));
  const plain = cipher.decrypt(base64ToBytes(sealed.ct));
  return utf8Decode(plain);
}

/** Passcode is never used as the encryption key in this local-only phase; it gates the unlock UI only, hashed + salted so the digits are never stored. */
export async function setPasscode(code: string): Promise<void> {
  const salt = bytesToBase64(await Crypto.getRandomBytesAsync(16));
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + code);
  await SecureStore.setItemAsync(PASSCODE_STORE_ID, JSON.stringify({ salt, hash }));
}

export async function hasPasscode(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PASSCODE_STORE_ID)) !== null;
}

export async function checkPasscode(code: string): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(PASSCODE_STORE_ID);
  if (!raw) return false;
  const { salt, hash } = JSON.parse(raw);
  const check = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + code);
  return check === hash;
}

export async function clearPasscode(): Promise<void> {
  await SecureStore.deleteItemAsync(PASSCODE_STORE_ID);
}

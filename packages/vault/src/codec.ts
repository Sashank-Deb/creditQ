/**
 * Record codec: AES-256-GCM with a fresh 96-bit nonce per write. The additional data
 * binds each ciphertext to its table, row id and payload version, so a ciphertext copied
 * into another row or table fails to decrypt (design doc 01, section 6.1).
 */
export interface Sealed {
  n: string;
  c: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (bytes: Uint8Array): string => {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
};

const fromB64 = (s: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
};

const aad = (table: string, id: string, v: number) => enc.encode(`creditq/v1|${table}|${id}|${v}`);

export interface Codec {
  seal(table: string, id: string, v: number, record: unknown): Promise<Sealed>;
  open<T>(table: string, id: string, v: number, sealed: Sealed): Promise<T>;
}

export const createAesGcmCodec = (key: CryptoKey): Codec => ({
  async seal(table, id, v, record) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const c = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: aad(table, id, v) },
      key,
      enc.encode(JSON.stringify(record)),
    );
    return { n: toB64(nonce), c: toB64(new Uint8Array(c)) };
  },
  async open<T>(table: string, id: string, v: number, sealed: Sealed): Promise<T> {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(sealed.n), additionalData: aad(table, id, v) },
      key,
      fromB64(sealed.c),
    );
    return JSON.parse(dec.decode(plain)) as T;
  },
});

/** A non-extractable key: script can use it, but nothing can read its bytes out. */
export const generateDeviceKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

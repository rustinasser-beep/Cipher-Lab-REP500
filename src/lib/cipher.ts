/**
 * Cryptographic Core for Cipher Lab REP500
 * AES-256-GCM + PBKDF2 + REP500 (500 Representations per byte)
 * Runs 100% in-browser using Web Crypto API.
 */

import { CipherEnvelope, DecryptionResult, EncryptionResult, RepresentationTable } from '../types';

export const REPS_PER_BYTE = 500;
export const BYTE_VALUES = 256;
export const TOTAL_SLOTS = REPS_PER_BYTE * BYTE_VALUES; // 128,000
export const CODE_BASE = 10_000_000_000; // 11-digit base (10,000,000,000)
export const CODE_WIDTH = 11;
export const DEFAULT_PBKDF2_ITERATIONS = 600_000;
export const SALT_LEN = 16;
export const IV_LEN = 12;

const subtle = window.crypto.subtle;

// Utility functions
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  // Chunking to prevent call stack overflow on large buffers
  const CHUNK_SIZE = 0x8000; // 32KB
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const totalLen = arrs.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Deterministic Pseudo-Random Number Generator based on HMAC-SHA256
 */
export class HmacDrbg {
  private hmacKey: CryptoKey;
  private counter: number;
  private buffer: Uint8Array;
  private pos: number;

  constructor(hmacKey: CryptoKey) {
    this.hmacKey = hmacKey;
    this.counter = 0;
    this.buffer = new Uint8Array(0);
    this.pos = 0;
  }

  private async _refill(): Promise<void> {
    const counterBuf = new Uint8Array(4);
    new DataView(counterBuf.buffer).setUint32(0, this.counter, false);
    this.counter++;
    const mac = await subtle.sign('HMAC', this.hmacKey, counterBuf);
    this.buffer = new Uint8Array(mac);
    this.pos = 0;
  }

  async nextByte(): Promise<number> {
    if (this.pos >= this.buffer.length) {
      await this._refill();
    }
    return this.buffer[this.pos++];
  }

  async nextUint32(): Promise<number> {
    let v = 0;
    for (let i = 0; i < 4; i++) {
      v = v * 256 + (await this.nextByte());
    }
    return v >>> 0;
  }

  async nextInt(maxExclusive: number): Promise<number> {
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let r: number;
    do {
      r = await this.nextUint32();
    } while (r >= limit);
    return r % maxExclusive;
  }
}

async function makeHmacKey(rawKeyBytes: Uint8Array): Promise<CryptoKey> {
  return subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function deriveSubkeyBits(
  password: string,
  salt: Uint8Array,
  label: string,
  lengthBits: number,
  iterations: number
): Promise<Uint8Array> {
  const baseKey = await subtle.importKey(
    'raw',
    utf8ToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const info = concatBytes(salt, utf8ToBytes(label));
  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: info,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    lengthBits
  );
  return new Uint8Array(bits);
}

export async function deriveKeys(
  password: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<{ encKey: CryptoKey; tableKeyBits: Uint8Array }> {
  const encKeyBits = await deriveSubkeyBits(
    password,
    salt,
    'custom-cipher|enc|v1',
    256,
    iterations
  );
  const tableKeyBits = await deriveSubkeyBits(
    password,
    salt,
    'custom-cipher|table|v1',
    256,
    iterations
  );
  const encKey = await subtle.importKey(
    'raw',
    encKeyBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return { encKey, tableKeyBits };
}

// Memory cache for built representation tables (keyed by derived table key hex)
const tableCache = new Map<string, RepresentationTable>();

export async function buildRepresentationTable(
  tableKeyBits: Uint8Array,
  onProgress?: (percent: number) => void
): Promise<RepresentationTable> {
  const cacheKey = toHex(tableKeyBits);
  if (tableCache.has(cacheKey)) {
    return tableCache.get(cacheKey)!;
  }

  const hmacKey = await makeHmacKey(tableKeyBits);
  const drbg = new HmacDrbg(hmacKey);

  // Initialize Fisher-Yates slots
  const slots = new Array<number>(TOTAL_SLOTS);
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    slots[i] = i;
  }

  // Shuffle 128,000 slots deterministically
  const reportInterval = 25_000;
  for (let i = TOTAL_SLOTS - 1; i > 0; i--) {
    const j = await drbg.nextInt(i + 1);
    const tmp = slots[i];
    slots[i] = slots[j];
    slots[j] = tmp;

    if (onProgress && i % reportInterval === 0) {
      onProgress(Math.round(((TOTAL_SLOTS - i) / TOTAL_SLOTS) * 100));
    }
  }

  const encodeTable: number[][] = new Array(BYTE_VALUES);
  const decodeMap = new Map<number, number>();

  for (let byteValue = 0; byteValue < BYTE_VALUES; byteValue++) {
    const codes = new Array<number>(REPS_PER_BYTE);
    for (let repIndex = 0; repIndex < REPS_PER_BYTE; repIndex++) {
      const position = byteValue * REPS_PER_BYTE + repIndex;
      const code = CODE_BASE + slots[position];
      codes[repIndex] = code;
      decodeMap.set(code, byteValue);
    }
    encodeTable[byteValue] = codes;
  }

  const table: RepresentationTable = { encodeTable, decodeMap };
  tableCache.set(cacheKey, table);
  if (onProgress) onProgress(100);
  return table;
}

/**
 * Encrypt arbitrary Uint8Array bytes (supporting both text and binary files)
 */
export async function encryptBytes(
  inputBytes: Uint8Array,
  password: string,
  options?: {
    iterations?: number;
    filename?: string;
    mime?: string;
    type?: 'text' | 'file';
    onProgress?: (status: string, percent?: number) => void;
  }
): Promise<EncryptionResult> {
  const startTime = performance.now();
  const iterations = options?.iterations || DEFAULT_PBKDF2_ITERATIONS;

  if (!password || password.trim().length === 0) {
    throw new Error('A non-empty secret key is required.');
  }

  options?.onProgress?.('Generating cryptographic salt & IV...', 10);
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));

  options?.onProgress?.('Deriving subkeys with PBKDF2...', 25);
  const { encKey, tableKeyBits } = await deriveKeys(password, salt, iterations);

  options?.onProgress?.('Executing AES-256-GCM encryption...', 45);
  const cipherBuf = await subtle.encrypt({ name: 'AES-GCM', iv }, encKey, inputBytes);
  const cipherBytes = new Uint8Array(cipherBuf);

  options?.onProgress?.('Building 128,000 REP500 permutation matrix...', 60);
  const { encodeTable } = await buildRepresentationTable(tableKeyBits);

  options?.onProgress?.('Mapping ciphertext bytes to REP500 slots...', 80);
  const selKeyBits = await subtle.digest('SHA-256', concatBytes(tableKeyBits, iv));
  const selHmacKey = await makeHmacKey(new Uint8Array(selKeyBits));
  const selDrbg = new HmacDrbg(selHmacKey);

  // Map each cipher byte to one of 500 pseudo-random 11-digit codes
  const codeParts: string[] = new Array(cipherBytes.length);
  for (let i = 0; i < cipherBytes.length; i++) {
    const byteValue = cipherBytes[i];
    const repIndex = await selDrbg.nextInt(REPS_PER_BYTE);
    codeParts[i] = String(encodeTable[byteValue][repIndex]);
  }
  const data = codeParts.join('');

  options?.onProgress?.('Assembling encrypted envelope...', 95);
  const envelope: CipherEnvelope = {
    v: 1,
    alg: 'AES-256-GCM+REP500',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    iter: iterations,
    type: options?.type || 'text',
    filename: options?.filename,
    mime: options?.mime,
    data,
  };

  const jsonStr = JSON.stringify(envelope);
  const ciphertext = bytesToBase64(utf8ToBytes(jsonStr));

  const durationMs = Math.round(performance.now() - startTime);
  options?.onProgress?.('Encryption complete', 100);

  return {
    ciphertext,
    envelope,
    stats: {
      inputBytes: inputBytes.byteLength,
      cipherBytes: cipherBytes.byteLength,
      repCodesCount: cipherBytes.length,
      outputLength: ciphertext.length,
      durationMs,
      iterations,
    },
  };
}

/**
 * Encrypt a text string
 */
export async function encryptText(
  plaintext: string,
  password: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
  onProgress?: (status: string, percent?: number) => void
): Promise<EncryptionResult> {
  const plainBytes = utf8ToBytes(plaintext);
  return encryptBytes(plainBytes, password, {
    iterations,
    type: 'text',
    onProgress,
  });
}

/**
 * Encrypt a file
 */
export async function encryptFile(
  file: File,
  password: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
  onProgress?: (status: string, percent?: number) => void
): Promise<EncryptionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  return encryptBytes(fileBytes, password, {
    iterations,
    type: 'file',
    filename: file.name,
    mime: file.type || 'application/octet-stream',
    onProgress,
  });
}

/**
 * Decrypt a Base64-encoded REP500 envelope
 */
export async function decryptData(
  ciphertext: string,
  password: string,
  onProgress?: (status: string, percent?: number) => void
): Promise<DecryptionResult> {
  const startTime = performance.now();

  if (!ciphertext || ciphertext.trim().length === 0) {
    throw new DecryptionError('Ciphertext cannot be empty.');
  }
  if (!password || password.length === 0) {
    throw new Error('A non-empty secret key is required for decryption.');
  }

  optionsProgress(onProgress, 'Parsing envelope...', 10);
  let envelope: CipherEnvelope;
  try {
    const rawJson = bytesToUtf8(base64ToBytes(ciphertext.trim()));
    envelope = JSON.parse(rawJson);
  } catch {
    throw new DecryptionError('Failed to parse envelope: invalid Base64 or corrupted payload.');
  }

  // Envelope validation
  if (
    !envelope ||
    envelope.v !== 1 ||
    envelope.alg !== 'AES-256-GCM+REP500' ||
    typeof envelope.salt !== 'string' ||
    typeof envelope.iv !== 'string' ||
    typeof envelope.data !== 'string' ||
    envelope.data.length % CODE_WIDTH !== 0
  ) {
    throw new DecryptionError('Invalid envelope structure or mismatched REP500 cipher version.');
  }

  let salt: Uint8Array;
  let iv: Uint8Array;
  try {
    salt = base64ToBytes(envelope.salt);
    iv = base64ToBytes(envelope.iv);
  } catch {
    throw new DecryptionError('Corrupted Salt or IV representation in envelope.');
  }

  if (salt.length !== SALT_LEN || iv.length !== IV_LEN) {
    throw new DecryptionError(`Invalid parameters: Salt must be ${SALT_LEN} bytes, IV must be ${IV_LEN} bytes.`);
  }

  // Use envelope-specified iterations, default to 600,000 for backward compatibility
  const iterations = envelope.iter && typeof envelope.iter === 'number' && envelope.iter > 0
    ? envelope.iter
    : DEFAULT_PBKDF2_ITERATIONS;

  optionsProgress(onProgress, `Deriving keys (${iterations.toLocaleString()} iterations)...`, 30);
  const { encKey, tableKeyBits } = await deriveKeys(password, salt, iterations);

  optionsProgress(onProgress, 'Reconstructing REP500 decode lookup table...', 55);
  const { decodeMap } = await buildRepresentationTable(tableKeyBits);

  optionsProgress(onProgress, 'Translating 11-digit REP codes to ciphertext bytes...', 75);
  const numCodes = envelope.data.length / CODE_WIDTH;
  const cipherBytes = new Uint8Array(numCodes);

  for (let i = 0; i < numCodes; i++) {
    const chunk = envelope.data.slice(i * CODE_WIDTH, (i + 1) * CODE_WIDTH);
    if (!/^\d{11}$/.test(chunk)) {
      throw new DecryptionError('Malformed numeric token detected in REP stream.');
    }
    const code = Number(chunk);
    const byteValue = decodeMap.get(code);
    if (byteValue === undefined) {
      throw new DecryptionError('Decryption failed: Incorrect key or corrupted ciphertext token.');
    }
    cipherBytes[i] = byteValue;
  }

  optionsProgress(onProgress, 'Authenticating and decrypting with AES-256-GCM...', 90);
  let decryptedBytes: Uint8Array;
  try {
    const plainBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, encKey, cipherBytes);
    decryptedBytes = new Uint8Array(plainBuf);
  } catch {
    throw new DecryptionError('Decryption failed: Authentication tag mismatch (wrong secret key or modified ciphertext).');
  }

  const durationMs = Math.round(performance.now() - startTime);
  optionsProgress(onProgress, 'Decryption finished.', 100);

  if (envelope.type === 'file') {
    return {
      type: 'file',
      fileData: decryptedBytes,
      filename: envelope.filename || 'decrypted_file.bin',
      mime: envelope.mime || 'application/octet-stream',
      stats: {
        cipherBytes: cipherBytes.byteLength,
        outputBytes: decryptedBytes.byteLength,
        durationMs,
        iterations,
      },
    };
  } else {
    let text = '';
    try {
      text = bytesToUtf8(decryptedBytes);
    } catch {
      // In case binary data was marked as text
      text = bytesToBase64(decryptedBytes);
    }

    return {
      type: 'text',
      plaintext: text,
      stats: {
        cipherBytes: cipherBytes.byteLength,
        outputBytes: decryptedBytes.byteLength,
        durationMs,
        iterations,
      },
    };
  }
}

function optionsProgress(cb?: (s: string, p?: number) => void, msg: string = '', pct?: number) {
  if (cb) cb(msg, pct);
}

/**
 * Parse an envelope from ciphertext string without decrypting
 */
export function inspectEnvelope(ciphertext: string): {
  valid: boolean;
  envelope?: CipherEnvelope;
  rawJson?: string;
  error?: string;
  stats?: {
    rawSize: number;
    codesCount: number;
    estimatedPayloadBytes: number;
  };
} {
  try {
    const rawJson = bytesToUtf8(base64ToBytes(ciphertext.trim()));
    const envelope = JSON.parse(rawJson) as CipherEnvelope;
    if (envelope.alg !== 'AES-256-GCM+REP500' || typeof envelope.data !== 'string') {
      return { valid: false, error: 'Not a valid AES-256-GCM+REP500 envelope.' };
    }
    const codesCount = envelope.data.length / CODE_WIDTH;
    return {
      valid: true,
      envelope,
      rawJson,
      stats: {
        rawSize: ciphertext.length,
        codesCount,
        estimatedPayloadBytes: Math.max(0, codesCount - 16), // minus 16 byte GCM tag
      },
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid Base64 or corrupted JSON structure.' };
  }
}

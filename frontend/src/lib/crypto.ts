/**
 * End-to-end encryption module using AES-256-GCM.
 *
 * Workflow:
 *   1. User provides password
 *   2. PBKDF2 derives an encryption key from password + random salt (100k iterations)
 *   3. AES-256-GCM encrypts the file with a random IV
 *   4. Output: [salt | iv | ciphertext] — concatenated bytes ready for IPFS
 *
 * Security:
 *   - 256-bit key (NIST recommendation)
 *   - GCM provides both confidentiality AND integrity (tampered files fail decryption)
 *   - PBKDF2 with 100k iterations slows down brute-force attacks
 *   - Salt + IV ensure that the same file with the same password yields different ciphertexts
 *
 * The password NEVER leaves the user's browser.
 */

const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes (recommended for GCM)
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits

/**
 * Derives an AES-GCM key from a password using PBKDF2.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a file with the given password.
 * @returns Encrypted blob in format: [salt(16) | iv(12) | ciphertext]
 */
export async function encryptFile(
  file: File,
  password: string
): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const fileBuffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    fileBuffer
  );

  // Concatenate: [salt | iv | ciphertext]
  const result = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + ciphertext.byteLength
  );
  result.set(salt, 0);
  result.set(iv, SALT_LENGTH);
  result.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return new Blob([result as BlobPart], { type: 'application/octet-stream' });
}

/**
 * Decrypts an encrypted blob with the given password.
 * Throws if the password is wrong or the data is corrupted (GCM auth tag fails).
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  password: string
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encryptedData);

  if (data.length < SALT_LENGTH + IV_LENGTH) {
    throw new Error('Encrypted data is too short');
  }

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    return plaintext;
  } catch (err) {
    throw new Error(
      'Decryption failed. Wrong password or corrupted file.'
    );
  }
}
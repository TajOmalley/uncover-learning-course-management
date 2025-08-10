import crypto from 'crypto'

const REQUIRED_BYTES = 32 // AES-256 key size

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET env var is required for token encryption')
  }

  // Accept base64, hex, or utf8 passphrase (derived)
  try {
    // Try base64
    const maybeBase64 = Buffer.from(secret, 'base64')
    if (maybeBase64.length === REQUIRED_BYTES) return maybeBase64
  } catch {}

  try {
    // Try hex
    const maybeHex = Buffer.from(secret, 'hex')
    if (maybeHex.length === REQUIRED_BYTES) return maybeHex
  } catch {}

  // Derive from utf8 passphrase using scrypt (stable KDF)
  return crypto.scryptSync(secret, 'uncover-learning-static-salt', REQUIRED_BYTES)
}

export function encryptToken(plainText: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12) // recommended size for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Format: ivBase64.tagBase64.cipherBase64
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptToken(payload: string): string {
  const [ivB64, tagB64, cipherB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error('Invalid encrypted token payload')
  }
  const key = getKey()
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(cipherB64, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
} 
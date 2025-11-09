import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENC_KEY = process.env.TOTP_ENCRYPTION_KEY

if (!ENC_KEY) {
  throw new Error('Missing TOTP_ENCRYPTION_KEY environment variable')
}

const KEY_BUFFER = (() => {
  const buffer = Buffer.from(ENC_KEY, ENC_KEY.length === 32 ? 'utf8' : 'base64')
  if (buffer.length !== 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must resolve to 32 bytes (AES-256 key)')
  }
  return buffer
})()

const IV_LENGTH = 12

export const encrypt = (plainText: string): string => {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', KEY_BUFFER, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`
}

export const decrypt = (payload: string | null | undefined): string | null => {
  if (!payload) return null
  const [ivB64, encryptedB64, authTagB64] = payload.split(':')
  if (!ivB64 || !encryptedB64 || !authTagB64) {
    throw new Error('Invalid encrypted payload format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', KEY_BUFFER, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}


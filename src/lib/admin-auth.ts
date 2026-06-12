import crypto from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(crypto.scrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64) as Buffer).toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 2) return false
  const [salt, hash] = parts
  try {
    const verifyHash = (await scryptAsync(password, salt, 64) as Buffer).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
  } catch {
    return false
  }
}

export function createResetToken(email: string): string {
  const secret = process.env.ADMIN_JWT_SECRET!
  const timestamp = Date.now().toString()
  const payload = `${email}:${timestamp}`
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${hmac}`).toString('base64url')
}

export function verifyResetToken(token: string): { valid: boolean; email?: string } {
  try {
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) return { valid: false }
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return { valid: false }
    const [email, timestamp, hmac] = parts
    if (Date.now() - parseInt(timestamp) > 3_600_000) return { valid: false }
    const payload = `${email}:${timestamp}`
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const valid = crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))
    return valid ? { valid: true, email } : { valid: false }
  } catch {
    return { valid: false }
  }
}

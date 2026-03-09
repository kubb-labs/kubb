import { createHash, randomBytes } from 'node:crypto'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

import { createHash, randomBytes } from 'node:crypto'
import os from 'node:os'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generate a cryptographically secure random token for agent authentication
 * Uses 32 bytes (256 bits) of randomness encoded as base64url
 *
 * The token is only shown once during agent creation and must be stored by the user.
 * Studio stores only the SHA-512 hash of the token.
 */
export function generateSecureToken(id = generateToken()): string {
  return createHash('sha256').update(id).digest('hex')
}

/**
 * Generate a stable machine ID derived from network interface MAC addresses and hostname.
 * The result is a SHA-256 hex digest that uniquely identifies the machine.
 *
 * In Docker environments MAC addresses and hostnames are ephemeral —
 * they change on every container recreation, which would trigger a new Polar license
 * activation on each restart and exhaust the allowed activation slots.
 * Set process.env.KUBB_STUDIO_SECRET to a fixed value (e.g. a UUID) to guarantee a stable identity
 * across container restarts.
 */
export function generateMachineToken(): string {
  if (process.env.KUBB_STUDIO_SECRET) {
    return generateSecureToken(process.env.KUBB_STUDIO_SECRET)
  }

  const interfaces = os.networkInterfaces()
  const macs: string[] = []

  for (const name in interfaces) {
    for (const iface of interfaces[name]!) {
      if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
        macs.push(iface.mac)
      }
    }
  }

  const hostname = os.hostname()
  const rawId = macs.join(',') + hostname

  return generateSecureToken(rawId)
}

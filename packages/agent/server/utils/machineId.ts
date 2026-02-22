import crypto from 'node:crypto'
import os from 'node:os'

/**
 * Generate a stable machine ID derived from network interface MAC addresses and hostname.
 * The result is a SHA-256 hex digest that uniquely identifies the machine.
 */
export function getMachineId(): string {
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

  return crypto.createHash('sha256').update(rawId).digest('hex')
}

import crypto from 'node:crypto'
import os from 'node:os'

/**
 * Generate a stable machine ID derived from network interface MAC addresses and hostname.
 * The result is a SHA-256 hex digest that uniquely identifies the machine.
 *
 * In Docker / containerised environments MAC addresses and hostnames are ephemeral —
 * they change on every container recreation, which would trigger a new Polar license
 * activation on each restart and exhaust the allowed activation slots.
 * Set KUBB_MACHINE_ID to a fixed value (e.g. a UUID) to guarantee a stable identity
 * across container restarts.
 */
export function getMachineId(): string {
  if (process.env.KUBB_MACHINE_ID) {
    return crypto.createHash('sha256').update(process.env.KUBB_MACHINE_ID).digest('hex')
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

  return crypto.createHash('sha256').update(rawId).digest('hex')
}

import { createHash, randomBytes } from 'node:crypto'
import os from 'node:os'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function generateMachineToken(): string {
  if (process.env.KUBB_AGENT_SECRET) {
    return hashToken(process.env.KUBB_AGENT_SECRET)
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

  return hashToken(macs.join(',') + os.hostname())
}

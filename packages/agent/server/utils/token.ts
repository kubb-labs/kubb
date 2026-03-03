import { createHash, randomBytes } from 'node:crypto'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateMachineToken(): string {
  return process.env.KUBB_AGENT_SECRET ? process.env.KUBB_AGENT_SECRET : createHash('sha256').update(generateToken()).digest('hex')
}

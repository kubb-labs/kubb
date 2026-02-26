import { createHash } from 'node:crypto'

export function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function generateMachineToken(): string {
  return hashToken(process.env.KUBB_AGENT_SECRET)
}

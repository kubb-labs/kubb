import { createHash, randomBytes } from 'node:crypto'

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function hashToken(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export const machineToken = hashToken(process.env.KUBB_AGENT_SECRET ?? generateToken())

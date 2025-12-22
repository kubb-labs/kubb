import { createHash } from 'node:crypto'

/**
 * Generates a unique hook ID based on the command and optional config name.
 * This ensures hooks from different configs don't interfere with each other.
 *
 * @param command - The hook command (e.g., 'prettier', 'eslint')
 * @param configName - Optional config name to include in the hash
 * @returns SHA-256 hash of the command and config name
 */
export function generateHookId(command: string, configName?: string): string {
  const input = [command, configName].filter(Boolean).join('::')
  return createHash('sha256').update(input).digest('hex')
}

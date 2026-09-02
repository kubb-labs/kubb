import { getAgentProfile } from 'gunshi/agent'

/**
 * Name of the AI coding agent driving this process, when one is detected (e.g. `'claude'`,
 * `'cursor'`). `undefined` when run by a human or an unrecognized caller.
 */
export function getAgentName(): string | undefined {
  const profile = getAgentProfile()
  return profile.isAgent ? profile.name : undefined
}

import type { InputServer } from '../nodes/input.ts'

/**
 * Picks the server at `index`, falling back to the first one. Returns `undefined` when there are no servers.
 *
 * @example
 * ```ts
 * ast.server.select(node.servers, { index: 1 })
 * ```
 */
export function select(servers: ReadonlyArray<InputServer> | undefined, { index = 0 }: { index?: number } = {}): InputServer | undefined {
  return servers?.[index] ?? servers?.[0]
}

/**
 * Maps each named server by its name. The first server with a name wins, and servers without one are left out.
 *
 * @example
 * ```ts
 * ast.server.byName(meta.servers).get('staging')?.url
 * ```
 */
export function byName(servers: ReadonlyArray<InputServer> | undefined): Map<string, InputServer> {
  const named = new Map<string, InputServer>()
  for (const server of servers ?? []) if (server.name && !named.has(server.name)) named.set(server.name, server)
  return named
}

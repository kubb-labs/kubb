import type { InputServer } from '../nodes/input.ts'

/** The server at `index`, else the first one. */
export function select({ servers, index = 0 }: { servers: ReadonlyArray<InputServer> | undefined; index?: number }): InputServer | undefined {
  return servers?.[index] ?? servers?.[0]
}

/** Named servers by name. The first server with a name wins. */
export function groupByName(servers: ReadonlyArray<InputServer> | undefined): Map<string, InputServer> {
  const named = new Map<string, InputServer>()
  for (const server of servers ?? []) if (server.name && !named.has(server.name)) named.set(server.name, server)
  return named
}

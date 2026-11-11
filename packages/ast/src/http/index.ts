import type { InputServer } from '../nodes/input.ts'

export { isHttpOperationNode as is } from '../guards.ts'
export * as responses from './responses.ts'
export * as status from './status.ts'

/** The server's URL when it is absolute and has no template variables, else `undefined`. */
export function baseURL(server: InputServer | undefined): string | undefined {
  if (!server || server.variables || server.url.includes('{') || !server.url.includes('://')) return undefined
  return URL.canParse(server.url) ? server.url : undefined
}

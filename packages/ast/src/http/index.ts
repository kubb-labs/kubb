import type { InputServer } from '../nodes/input.ts'

export { isHttpOperationNode as is } from '../guards.ts'
export * as responses from './responses.ts'
export * as status from './status.ts'

/**
 * The server's URL when an HTTP client can call it as is: absolute and without template variables. Returns
 * `undefined` for a relative URL such as `/v2`, which would drop the client's host, and for a templated one.
 *
 * @example
 * ```ts
 * ast.http.baseURL(ast.server.select(node.servers)) // 'https://api.example.com/v2'
 * ```
 */
export function baseURL(server: InputServer | undefined): string | undefined {
  if (!server || server.variables || server.url.includes('{') || !server.url.includes('://')) return undefined
  return URL.canParse(server.url) ? server.url : undefined
}

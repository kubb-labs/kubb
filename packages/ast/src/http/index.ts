import type { InputServer } from '../nodes/input.ts'
import type { HttpOperationNode } from '../nodes/operation.ts'
import type { ParameterNode } from '../nodes/parameter.ts'

export { isHttpOperationNode as is } from '../guards.ts'
export * as responses from './responses.ts'
export * as status from './status.ts'

/** The server's URL when it is absolute and has no template variables, else `undefined`. */
export function baseURL(server: InputServer | undefined): string | undefined {
  if (!server || server.variables || server.url.includes('{') || !server.url.includes('://')) return undefined
  return URL.canParse(server.url) ? server.url : undefined
}

/** The operation's parameters by location. A name repeated within one location keeps its first parameter. */
export function parameters(node: Pick<HttpOperationNode, 'parameters'>): Record<'path' | 'query' | 'header' | 'cookie', Array<ParameterNode>> {
  const group = (location: ParameterNode['in']) => {
    const seen = new Set<string>()
    return node.parameters.filter((param) => {
      if (param.in !== location || seen.has(param.name)) return false
      seen.add(param.name)
      return true
    })
  }
  return { path: group('path'), query: group('query'), header: group('header'), cookie: group('cookie') }
}

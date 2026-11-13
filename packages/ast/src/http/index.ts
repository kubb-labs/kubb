import { memo } from '@internals/utils'
import type { InputServer } from '../nodes/input.ts'
import type { HttpOperationNode } from '../nodes/operation.ts'
import type { ParameterNode } from '../nodes/parameter.ts'

export { isHttpOperationNode as isOperation } from '../guards.ts'
export * as requestBody from './requestBody.ts'
export * as responses from './responses.ts'
export * as status from './status.ts'

/** The server's URL when it is absolute and has no template variables, else `undefined`. */
export function getBaseURL(server: InputServer | undefined): string | undefined {
  if (!server || server.variables || server.url.includes('{') || !server.url.includes('://')) return undefined
  return URL.canParse(server.url) ? server.url : undefined
}

type ParameterGroups = Record<'path' | 'query' | 'header' | 'cookie', Array<ParameterNode>>

// Every plugin's generator visits the same node, so the groups are built once per node.
const parametersByNode = memo.create<Pick<HttpOperationNode, 'parameters'>, ParameterGroups>({ type: 'weak' })

/** The operation's parameters by location, with a `querystring` parameter in `query`. A repeated name keeps its first parameter. */
export function groupParameters(node: Pick<HttpOperationNode, 'parameters'>): ParameterGroups {
  return memo(parametersByNode, node, () => {
    const group = (...locations: Array<ParameterNode['in']>) => {
      const seen = new Set<string>()
      return locations.flatMap((location) =>
        node.parameters.filter((param) => {
          if (param.in !== location || seen.has(param.name)) return false
          seen.add(param.name)
          return true
        }),
      )
    }
    // A `querystring` parameter left whole, such as a JSON one, is sent as the query string, so it joins the query group.
    return { path: group('path'), query: group('query', 'querystring'), header: group('header'), cookie: group('cookie') }
  })
}

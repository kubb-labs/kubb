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
const parametersByNode = memo.create<Pick<HttpOperationNode, 'parameters'>, ParameterGroups>({ weak: true })

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

export type RequestGroups = {
  path: boolean
  query: boolean
  body: boolean
  headers: boolean
  cookies: boolean
  /**
   * Which groups hold a required member. `cookies` is never required: a browser sends its cookies itself.
   */
  required: { path: boolean; query: boolean; headers: boolean; body: boolean }
  /**
   * Whether the grouped request parameter can be left out, because no group holds a required member.
   */
  isOptional: boolean
  /**
   * The request body's media types, in document order.
   */
  contentTypes: Array<string>
  /**
   * Whether the body offers more than one media type with a schema, so a caller must pick one.
   */
  hasContentTypeChoice: boolean
}

const requestGroupsByNode = memo.create<Pick<HttpOperationNode, 'parameters' | 'requestBody'>, RequestGroups>({ weak: true })

/**
 * What a request carries: which parameter groups and body are present, which hold a required member, and the body's
 * media types. Built once per operation.
 *
 * @example
 * ```ts
 * const { path, query, body, isOptional } = ast.http.getRequestGroups(node)
 * ```
 */
export function getRequestGroups(node: Pick<HttpOperationNode, 'parameters' | 'requestBody'>): RequestGroups {
  return memo(requestGroupsByNode, node, () => {
    const { path, query, header, cookie } = groupParameters(node)
    const content = node.requestBody?.content ?? []
    const body = Boolean(content[0]?.schema)
    const required = {
      path: path.some((param) => param.required),
      query: query.some((param) => param.required),
      headers: header.some((param) => param.required),
      body: body && node.requestBody?.required === true,
    }

    return {
      path: path.length > 0,
      query: query.length > 0,
      body,
      headers: header.length > 0,
      cookies: cookie.length > 0,
      required,
      isOptional: !required.path && !required.query && !required.headers && !required.body,
      contentTypes: content.map((entry) => entry.contentType),
      hasContentTypeChoice: content.filter((entry) => entry.schema).length > 1,
    }
  })
}

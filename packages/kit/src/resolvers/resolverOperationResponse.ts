import type { OperationNode, StatusCode } from '@kubb/ast'
import { defineResolver } from '@kubb/core'
import { operationKey } from './operationKey.ts'

/**
 * Names an operation's responses: one name per status code and its headers, plus the body, the
 * map of all responses, and the combined response. Every name goes through the plugin's top-level
 * `name`, so it follows that plugin's casing.
 *
 * @example Add a plugin-specific method next to the shared ones
 * ```ts
 * createResolver<PluginZod>({
 *   pluginName: 'plugin-zod',
 *   response: {
 *     ...resolverOperationResponse.response,
 *     error(node) {
 *       return this.name(`${node.operationId} Error`)
 *     },
 *   },
 * })
 * ```
 */
export const resolverOperationResponse = defineResolver({
  response: {
    status(node: OperationNode, statusCode: StatusCode): string {
      const name = this.name(`${node.operationId} Status ${statusCode}`)
      return this.resolveName({ key: operationKey(node, 'response', 'status', statusCode), name })
    },
    /**
     * Name of the headers a response declares, such as `ListPetsStatus200Headers`.
     */
    headers(node: OperationNode, statusCode: StatusCode): string {
      const name = this.name(`${node.operationId} Status ${statusCode} Headers`)
      return this.resolveName({ key: operationKey(node, 'response', 'headers', statusCode), name })
    },
    body(node: OperationNode): string {
      const name = this.name(`${node.operationId} Body`)
      return this.resolveName({ key: operationKey(node, 'response', 'body'), name })
    },
    responses(node: OperationNode): string {
      const name = this.name(`${node.operationId} Responses`)
      return this.resolveName({ key: operationKey(node, 'response', 'responses'), name })
    },
    response(node: OperationNode): string {
      const name = this.name(`${node.operationId} Response`)
      return this.resolveName({ key: operationKey(node, 'response', 'response'), name })
    },
  },
})

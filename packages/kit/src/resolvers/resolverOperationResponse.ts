import type { OperationNode, StatusCode } from '@kubb/ast'
import { defineResolver } from '../resolver/Resolver.ts'
import { operationKey } from './operationKey.ts'

/** Names an operation's responses (`response.*`) through the plugin's top-level `name`. */
export const resolverOperationResponse = defineResolver({
  response: {
    status(node: OperationNode, statusCode: StatusCode): string {
      const name = this.name(`${node.operationId} Status ${statusCode}`)
      return this.resolveName({ key: operationKey(node, 'response', 'status', statusCode), name })
    },
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

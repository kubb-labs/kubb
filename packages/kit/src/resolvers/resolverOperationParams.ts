import type { OperationNode, ParameterNode } from '@kubb/ast'
import { defineResolver } from '../resolver/Resolver.ts'
import { operationKey } from './operationKey.ts'

/** Names an operation's parameters (`param.*`) through the plugin's top-level `name`. */
export const resolverOperationParams = defineResolver({
  param: {
    name(node: OperationNode, param: ParameterNode): string {
      const name = this.name(`${node.operationId} ${param.in} ${param.name}`)
      return this.resolveName({ key: operationKey(node, 'param', 'name', param.in, param.name), name })
    },
    path(node: OperationNode): string {
      const name = this.name(`${node.operationId} Path`)
      return this.resolveName({ key: operationKey(node, 'param', 'path'), name })
    },
    query(node: OperationNode): string {
      const name = this.name(`${node.operationId} Query`)
      return this.resolveName({ key: operationKey(node, 'param', 'query'), name })
    },
    headers(node: OperationNode): string {
      const name = this.name(`${node.operationId} Headers`)
      return this.resolveName({ key: operationKey(node, 'param', 'headers'), name })
    },
    cookies(node: OperationNode): string {
      const name = this.name(`${node.operationId} Cookies`)
      return this.resolveName({ key: operationKey(node, 'param', 'cookies'), name })
    },
  },
})

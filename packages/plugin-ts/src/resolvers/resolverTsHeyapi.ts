import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'

/**
 * Close-compatible naming preset for Hey API style operation artifacts.
 * Keeps v5 semantics while using request/response suffixes familiar to Hey API users.
 */
export const resolverTsHeyapi = defineResolver<PluginTs>(() => {
  return {
    ...resolverTs,
    name: 'heyapi',
    resolveDataName(node) {
      return this.resolveName(`${node.operationId} Request`)
    },
    resolveDataTypedName(node) {
      return this.resolveTypedName(`${node.operationId} Request`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Result`)
    },
    resolveResponseTypedName(node) {
      return this.resolveTypedName(`${node.operationId} Result`)
    },
    resolveResponsesName(node) {
      return this.resolveName(`${node.operationId} ResponseMap`)
    },
    resolveResponsesTypedName(node) {
      return this.resolveTypedName(`${node.operationId} ResponseMap`)
    },
  }
})

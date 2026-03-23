import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'

/**
 * Close-compatible naming preset for Orval style operation artifacts.
 * Keeps v5 semantics while using mutation/query-oriented request/response suffixes.
 */
export const resolverTsOrval = defineResolver<PluginTs>(() => {
  return {
    ...resolverTs,
    name: 'orval',
    resolveDataName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveDataTypedName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveTypedName(`${node.operationId} ${suffix}`)
    },
    resolveResponsesName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveResponsesTypedName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return this.resolveTypedName(`${node.operationId} ${suffix}`)
    },
    resolveResponseName(node) {
      const suffix = node.method === 'GET' ? 'QueryResult' : 'MutationResult'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveResponseTypedName(node) {
      const suffix = node.method === 'GET' ? 'QueryResult' : 'MutationResult'
      return this.resolveTypedName(`${node.operationId} ${suffix}`)
    },
  }
})

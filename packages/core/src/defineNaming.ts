import type { OperationNode, ParameterNode } from '@kubb/ast/types'
import type { ResolveNameParams } from './types.ts'

/**
 * Resolver function that converts a raw name (and optional entity type) into a
 * string identifier — without the `pluginName` routing used by `PluginDriver.resolveName`.
 */
export type NamingResolveName = (params: Omit<ResolveNameParams, 'pluginName'>) => string

/**
 * Contract for a plugin-ts naming object.
 * Each method accepts an optional `resolveName` so callers can swap in a
 * driver-bound resolver (e.g. `driver.resolveName`) while reusing the same
 * name-construction logic.
 */
export type Naming = {
  /**
   * Resolves the name for a schema node, e.g. `Pet` or `PetList`.
   * @throws When `node.name` is undefined.
   */
  getSchemaName(node: { name?: string }, opts?: { type?: 'file' | 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for an individual parameter type.
   *
   * @example
   * naming.getParameterName(node, { name: 'petId', in: 'path' }) // → 'DeletePetPathPetId'
   */
  getParameterName(node: Pick<OperationNode, 'operationId'>, param: Pick<ParameterNode, 'name' | 'in'>, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for a specific HTTP response status type.
   *
   * @example
   * naming.getResponseStatusName(node, 200) // → 'DeletePetStatus200'
   */
  getResponseStatusName(node: Pick<OperationNode, 'operationId'>, statusCode: number | string, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for the request body type.
   *
   * @example
   * naming.getRequestBodyName(node) // → 'CreatePetData'
   */
  getRequestBodyName(node: Pick<OperationNode, 'operationId'>, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for the `RequestConfig` type.
   *
   * @example
   * naming.getRequestConfigName(node) // → 'DeletePetRequestConfig'
   */
  getRequestConfigName(node: Pick<OperationNode, 'operationId'>, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for the `Responses` status-code map type.
   *
   * @example
   * naming.getResponsesName(node) // → 'ListPetsResponses'
   */
  getResponsesName(node: Pick<OperationNode, 'operationId'>, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
  /**
   * Resolves the name for the union `Response` type (union of all response types).
   *
   * @example
   * naming.getResponseName(node) // → 'ListPetsResponse'
   */
  getResponseName(node: Pick<OperationNode, 'operationId'>, opts?: { type?: 'function' | 'type'; resolveName?: NamingResolveName }): string
}

/**
 * Creates a typed naming object, following the same factory pattern as
 * `definePlugin`, `defineLogger`, and `defineAdapter`.
 *
 * Use this in a plugin to provide a `naming` export so consumers can resolve
 * the exact type names the plugin generates without hardcoding naming conventions.
 *
 * @example
 * ```ts
 * import { defineNaming } from '@kubb/core'
 *
 * export const naming = defineNaming({
 *   getSchemaName(node, opts) { ... },
 *   getResponseName(node, opts) { ... },
 *   // ...
 * })
 * ```
 */
export function defineNaming(naming: Naming): Naming {
  return { ...naming }
}

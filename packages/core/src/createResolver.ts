import type { OperationNode, ParameterNode } from '@kubb/ast/types'

/**
 * Resolver function that converts a raw name (and optional entity type) into a
 * string identifier — without the `pluginName` routing used by `PluginDriver.resolveName`.
 */
export type NamingResolveName = (params: { name: string; type?: 'file' | 'function' | 'type' | 'const' }) => string

/**
 * Contract for a naming object provided by a plugin.
 *
 * The `TName` generic captures the plugin name literal so callers have
 * type-safe access to `naming.pluginName` when constructing a
 * `driver.resolveName` call.
 *
 * Each method accepts an optional `resolveName` so callers can swap in a
 * driver-bound resolver (e.g. `driver.resolveName`) while reusing the same
 * name-construction logic.
 */
export type Naming<TName extends string = string> = {
  /**
   * The name of the plugin this naming object belongs to.
   * Use this when calling `driver.resolveName` so the driver can apply the
   * plugin-specific name transformers configured by the user.
   *
   * @example
   * ```ts
   * naming.getRequestBodyName(node, {
   *   resolveName: ({ name, type }) =>
   *     driver.resolveName({ name, type, pluginName: naming.pluginName }),
   * })
   * ```
   */
  pluginName: TName
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
 * Creates a typed naming object bound to a plugin name, following the same
 * factory pattern as `definePlugin`, `defineLogger`, and `defineAdapter`.
 *
 * Pass the plugin's name constant as the first argument so consumers have
 * type-safe access to `naming.pluginName` when forwarding calls to
 * `driver.resolveName`.
 *
 * @example
 * ```ts
 * import { createResolver } from '@kubb/core'
 *
 * export const naming = createResolver('my-plugin', {
 *   getSchemaName(node, opts) { ... },
 *   getResponseName(node, opts) { ... },
 *   // ...
 * })
 *
 * // Consumer:
 * naming.getRequestBodyName(node, {
 *   resolveName: ({ name, type }) =>
 *     driver.resolveName({ name, type, pluginName: naming.pluginName }),
 * })
 * ```
 */
export function createResolver<TName extends string>(pluginName: TName, naming: Omit<Naming<TName>, 'pluginName'>): Naming<TName> {
  return { pluginName, ...naming }
}


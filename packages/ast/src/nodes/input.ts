import { nodeKinds } from '../constants.ts'
import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A server from the source document, with `{variable}` placeholders filled from their defaults.
 */
/**
 * A variable declared by a server URL template.
 */
export type InputServerVariable = {
  default?: string
  enum?: Array<string>
  description?: string
}

export type InputServer = {
  url: string
  description?: string
  /**
   * Variables of the source URL template, copied as-is. `url` already has their defaults filled in, so
   * this tells a templated server apart from a literal one. Absent when the server declares none.
   */
  variables?: Record<string, InputServerVariable>
}

/**
 * An authentication scheme from the source document, keyed by `name`. `parameterName` is the header, query, or cookie name of an `apiKey`.
 */
export type InputSecurityScheme = {
  name: string
  type: string
  description?: string
  scheme?: string
  bearerFormat?: string
  in?: string
  parameterName?: string
}

/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 * Every field is a plain JSON value.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet Store', version: '1.0.0', baseURL: 'https://api.example.com/v2' }
 * ```
 */
export type InputMeta = {
  /**
   * API title from `info.title` in the source document.
   */
  title?: string
  /**
   * API description from `info.description` in the source document.
   */
  description?: string
  /**
   * API version string from `info.version` in the source document.
   */
  version?: string
  /**
   * Resolved base URL from the first matching server entry in the source document.
   */
  baseURL?: string | null
  servers?: Array<InputServer>
  securitySchemes?: Array<InputSecurityScheme>
  /**
   * Vendor extensions (`x-*` keys) from the document root, copied as-is. Absent when the root has none.
   */
  extensions?: Record<string, unknown>
}

/**
 * Input AST node that contains all schemas and operations for one API document.
 * Produced by the adapter and consumed by all Kubb plugins.
 *
 * @example
 * ```ts
 * const input: InputNode = {
 *   kind: 'Input',
 *   schemas: [],
 *   operations: [],
 *   meta: {},
 * }
 * ```
 */
export type InputNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Input'
  /**
   * All schema nodes in the document.
   */
  schemas: Array<SchemaNode>
  /**
   * All operation nodes in the document.
   */
  operations: Array<OperationNode>
  /**
   * Document metadata populated by the adapter.
   */
  meta: InputMeta
}

/**
 * Creates an `InputNode`, defaulting `schemas`/`operations` to empty arrays and `meta` to an empty
 * object. Every call allocates fresh defaults so no two inputs share them.
 *
 * @example
 * ```ts
 * const input = createInput()
 * // { kind: 'Input', schemas: [], operations: [] }
 * ```
 */
export function createInput(overrides: Partial<Omit<InputNode, 'kind'>> = {}): InputNode {
  return { schemas: [], operations: [], meta: {}, ...overrides, kind: nodeKinds.input }
}

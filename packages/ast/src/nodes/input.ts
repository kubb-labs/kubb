import { nodeKinds } from '../constants.ts'
import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * A variable declared by a server URL template.
 */
export type InputServerVariable = {
  default?: string
  enum?: Array<string>
  description?: string
}

/**
 * A server from the source document, with `{variable}` placeholders filled from their defaults.
 */
export type InputServer = {
  url: string
  /** Short name that identifies the server, such as `production`. */
  name?: string
  description?: string
  /**
   * Variables of the source URL template, copied as-is. `url` already has their defaults filled in, so
   * this tells a templated server apart from a literal one. Absent when the server declares none.
   */
  variables?: Record<string, InputServerVariable>
}

/** A tag from the source document that operations are grouped under. */
export type InputTag = {
  name: string
  /** Short one-line summary, such as the label a docs site shows. */
  summary?: string
  description?: string
  /** Name of the tag this tag nests under. `group: { type: 'tag' }` places its files in the parent's folder. */
  parent?: string
  /** What the tag is for, such as `nav`, `badge`, or `audience`. */
  kind?: string
}

/** One OAuth2 flow: the endpoints it calls and the scopes it grants. */
export type InputOAuthFlow = {
  authorizationUrl?: string
  /** Endpoint that issues the device code of the device authorization flow (RFC 8628). */
  deviceAuthorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  /** Scope names mapped to their descriptions. */
  scopes?: Record<string, string>
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
  /** OAuth2 flows by name, such as `authorizationCode` or `deviceAuthorization`. */
  flows?: Record<string, InputOAuthFlow>
  /** URL of the OAuth2 authorization server metadata (RFC 8414). */
  oauth2MetadataUrl?: string
  deprecated?: boolean
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
  /** Tags declared at the document root, in document order. Absent when the document declares none. */
  tags?: Array<InputTag>
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

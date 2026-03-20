import type { BaseNode } from './base.ts'

/**
 * A single named function parameter.
 *
 * @example Simple required param
 * `name: Type`
 *
 * @example Optional param
 * `name?: Type`
 *
 * @example Param with default
 * `name: Type = defaultValue`
 *
 * @example Rest / spread param
 * `...name: Type[]`
 */
export type FunctionParameterNode = BaseNode & {
  kind: 'FunctionParameter'
  /**
   * The parameter name as it appears in the function signature.
   */
  name: string
  /**
   * TypeScript type annotation (raw string, e.g. `"string"`, `"Pet[]"`, `"Partial<Config>"`).
   * Omit for untyped JavaScript output.
   */
  type?: string
  /**
   * When `true` the parameter is emitted as a rest parameter (`...name`).
   * @default false
   */
  rest?: boolean
} /**
 * Explicitly optional parameter — rendered with `?` in the signature.
 * Cannot be combined with `default`; a parameter with a default is implicitly optional.
 * @example `name?: Type`
 */ & (
    | { optional: true; default?: never }
    /**
     * Required parameter, or a parameter with a default value (implicitly optional).
     * @example Required: `name: Type`
     * @example With default: `name: Type = default`
     */
    | { optional?: false; default?: string }
  )

/**
 * An object-destructured function parameter group.
 *
 * Renders as `{ key1, key2 }: { key1: Type1; key2: Type2 } = {}` in a declaration,
 * or as individual top-level params when `inline` is `true`.
 *
 * Replaces `mode: 'object'` / `mode: 'inlineSpread'` from the legacy `FunctionParams` API.
 *
 * @example Object destructuring with auto-computed type (declaration)
 * `{ id, name }: { id: string; name: string } = {}`
 *
 * @example Inline (spread) — children emitted as individual top-level params
 * `id: string, name: string`
 */
export type ObjectBindingParameterNode = BaseNode & {
  kind: 'ObjectBindingParameter'
  /**
   * The individual parameters that form the destructured object.
   * Rendered as `{ key1, key2 }` in declarations, or spread inline when `inline` is `true`.
   */
  properties: Array<FunctionParameterNode>
  /**
   * Explicit TypeScript type annotation for the whole object param.
   * When absent the printer auto-computes `{ key1: Type1; key2: Type2 }` from `params`.
   */
  type?: string
  /**
   * When `true` the `params` are emitted as individual top-level parameters instead of
   * being wrapped in a destructuring pattern (`{ key1, key2 }`).
   *
   * Equivalent to `mode: 'inlineSpread'` in the legacy `FunctionParams` API.
   * @default false
   */
  inline?: boolean
  /**
   * Whether the whole object group is optional.
   * When absent the printer auto-computes this: optional if every child param is optional.
   */
  optional?: boolean
  /**
   * Default value for the object group, written verbatim after `=`.
   * Commonly `'{}'` to allow omitting the argument entirely.
   */
  default?: string
}

/**
 * A complete ordered parameter list for a function.
 *
 * The printer is responsible for sorting (required → optional → has-default).
 * Nodes themselves are treated as plain, immutable data.
 *
 * Renders differently depending on the output mode:
 * - `declaration` → `(id: string, config: Config = {})` — typed function parameter list
 * - `call`        → `(id, { method, url })` — function call arguments
 * - `keys`        → `{ id, config }` — key names only (for destructuring)
 * - `values`      → `{ id: id, config: config }` — key → value pairs
 */
export type FunctionParametersNode = BaseNode & {
  kind: 'FunctionParameters'
  params: Array<FunctionParameterNode | ObjectBindingParameterNode>
}

/**
 * The three function-signature AST node variants.
 */
export type FunctionNode = FunctionParameterNode | ObjectBindingParameterNode | FunctionParametersNode

/**
 * Handler map keys — one per `FunctionNode` kind.
 */
export type FunctionNodeType = 'functionParameter' | 'objectBindingParameter' | 'functionParameters'

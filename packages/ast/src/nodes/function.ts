import type { BaseNode } from './base.ts'

/**
 * AST node for one function parameter.
 *
 * @example Required parameter
 * `name: Type`
 *
 * @example Optional param
 * `name?: Type`
 *
 * @example Parameter with default
 * `name: Type = defaultValue`
 *
 * @example Rest parameter
 * `...name: Type[]`
 */
export type FunctionParameterNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'FunctionParameter'
  /**
   * Parameter name in the generated signature.
   */
  name: string
  /**
   * TypeScript type text, for example, `"string"` or `"Pet[]"`.
   * Omit for untyped JavaScript output.
   */
  type?: string
  /**
   * When `true` the parameter is emitted as a rest parameter (`...name`).
   * @default false
   */
  rest?: boolean
} /**
 * Optional parameter, rendered with `?` in declarations.
 * Cannot be combined with `default` because defaulted parameters are already optional.
 * @example `name?: Type`
 */ & (
    | { optional: true; default?: never }
    /**
     * Required parameter, or parameter with a default value.
     * @example Required: `name: Type`
     * @example With default: `name: Type = default`
     */
    | { optional?: false; default?: string }
  )

/**
 * AST node for object-destructured function parameters.
 *
 * This node renders as `{ key1, key2 }: { key1: Type1; key2: Type2 } = {}` in declarations,
 * or as individual top-level parameters when `inline` is `true`.
 *
 * This replaces `mode: 'object'` and `mode: 'inlineSpread'` from the old `FunctionParams` API.
 *
 * @example Object destructuring with auto-computed type (declaration)
 * `{ id, name }: { id: string; name: string } = {}`
 *
 * @example Inline (spread) — children emitted as individual top-level params
 * `id: string, name: string`
 */
export type ObjectBindingParameterNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'ObjectBindingParameter'
  /**
   * The individual parameters that form the destructured object.
   * Rendered as `{ key1, key2 }` in declarations, or spread inline when `inline` is `true`.
   */
  properties: Array<FunctionParameterNode>
  /**
   * Optional type text for the full object parameter.
   * When absent, the printer auto-computes `{ key1: Type1; key2: Type2 }` from `properties`.
   */
  type?: string
  /**
   * When `true`, `properties` are emitted as individual top-level parameters instead of
   * being wrapped in a destructuring pattern (`{ key1, key2 }`).
   *
   * Equivalent to `mode: 'inlineSpread'` in the legacy `FunctionParams` API.
   * @default false
   */
  inline?: boolean
  /**
   * Whether the full object binding is optional.
   * If omitted, printers infer this from child properties.
   */
  optional?: boolean
  /**
   * Default value for the object group, written verbatim after `=`.
   * Commonly `'{}'` to allow omitting the argument entirely.
   */
  default?: string
}

/**
 * AST node for a complete function parameter list.
 *
 * Printers are responsible for sorting (`required` → `optional` → `defaulted`).
 * Nodes are plain immutable data.
 *
 * Renders differently depending on the output mode:
 * - `declaration` → `(id: string, config: Config = {})` — function declaration parameters
 * - `call`        → `(id, { method, url })` — function call arguments
 * - `keys`        → `{ id, config }` — key names only (for destructuring)
 * - `values`      → `{ id: id, config: config }` — key → value pairs
 */
export type FunctionParametersNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'FunctionParameters'
  /**
   * Ordered parameter nodes.
   */
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

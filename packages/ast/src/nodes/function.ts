import type { BaseNode } from './base.ts'

/**
 * AST node representing a language-agnostic type expression used as a function parameter
 * type annotation. Each language printer renders the variant into its own syntax.
 *
 * - `struct` — an inline anonymous type grouping named fields.
 *   TypeScript renders as `{ petId: string; name?: string }`.
 * - `member` — a single named field accessed from a named group type.
 *   TypeScript renders as `PathParams['petId']`.
 *
 * @example Reference variant
 * ```ts
 * createTypeExpression({ variant: 'reference', name: 'QueryParams' })
 * // QueryParams
 * ```
 *
 * @example Struct variant
 * ```ts
 * createTypeExpression({ variant: 'struct', properties: [{ name: 'petId', optional: false, type: createTypeExpression({ variant: 'reference', name: 'string' }) }] })
 * // { petId: string }
 * ```
 *
 * @example Member variant
 * ```ts
 * createTypeExpression({ variant: 'member', base: 'PathParams', key: 'petId' })
 * // PathParams['petId']
 * ```
 */
export type ParamsTypeNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'ParamsType'
} & (
    | {
        /**
         * Reference variant — a plain type name or identifier.
         * TypeScript renders as-is, e.g. `string`, `QueryParams`, `Partial<Config>`.
         */
        variant: 'reference'
        /**
         * The full type name string, e.g. `'string'`, `'QueryParams'`, `'Partial<Config>'`.
         */
        name: string
      }
    | {
        /**
         * Struct variant — an inline anonymous type grouping named fields.
         * TypeScript renders as `{ key: Type; other?: OtherType }`.
         */
        variant: 'struct'
        /**
         * Properties of the struct type.
         */
        properties: Array<{ name: string; optional: boolean; type: ParamsTypeNode }>
      }
    | {
        /**
         * Member variant — a single named field accessed from a group type.
         * TypeScript renders as `Base['key']`.
         */
        variant: 'member'
        /**
         * Base type name, e.g. `'DeletePetPathParams'`.
         */
        base: string
        /**
         * The field name to access, e.g. `'petId'`.
         */
        key: string
      }
  )

/**
 * AST node for one function parameter.
 *
 * @example Required parameter
 * `name: Type`
 *
 * @example Optional parameter
 * `name?: Type`
 *
 * @example Parameter with default value
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
   * Type annotation as a structured {@link ParamsTypeNode}.
   * Omit for untyped output.
   *
   * @example Reference type node
   * `{ kind: 'ParamsType', variant: 'reference', name: 'string' }` → `petId: string`
   *
   * @example Struct type node
   * `{ kind: 'ParamsType', variant: 'struct', properties: [...] }` → `{ key: Type; other?: OtherType }`
   *
   * @example Member type node
   * `{ kind: 'ParamsType', variant: 'member', base: 'PathParams', key: 'petId' }` → `PathParams['petId']`
   */
  type?: ParamsTypeNode
  /**
   * When `true` the parameter is emitted as a rest parameter.
   *
   * @example Rest parameter
   * `...name: Type[]`
   */
  rest?: boolean
} /**
 * Optional parameter — rendered with `?` and may be omitted by the caller.
 * Cannot be combined with `default` because a defaulted parameter is already optional.
 */ & (
    | { optional: true; default?: never }
    /**
     * Required parameter, or a parameter with a default value.
     *
     * @example Required
     * `name: Type`
     *
     * @example With default
     * `name: Type = default`
     */
    | { optional?: false; default?: string }
  )

/**
 * AST node for a group of related function parameters treated as a single unit.
 *
 * Each language printer decides how to render this group:
 * - TypeScript/JS: destructured object `{ key1, key2 }: { key1: Type1; key2: Type2 } = {}`
 * - Python: keyword-only args or a typed dict parameter
 * - C# / Kotlin: named record / data-class parameter
 *
 * When `inline` is `true`, the group is spread as individual top-level parameters
 * rather than wrapped in a single grouped construct.
 *
 * @example Grouped destructuring
 * `{ id, name }: { id: string; name: string } = {}`
 *
 * @example Inline (spread as individual parameters)
 * `id: string, name: string`
 */
export type ParameterGroupNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'ParameterGroup'
  /**
   * The individual parameters that form the group.
   * Rendered as a destructured object or spread inline when `inline` is `true`.
   */
  properties: Array<FunctionParameterNode>
  /**
   * Optional explicit type annotation for the whole group.
   * When absent, printers auto-compute it from `properties`.
   */
  type?: ParamsTypeNode
  /**
   * When `true`, `properties` are emitted as individual top-level parameters instead of
   * being wrapped in a single grouped construct.
   *
   * @default false
   */
  inline?: boolean
  /**
   * Whether the group as a whole is optional.
   * If omitted, printers infer this from child properties.
   */
  optional?: boolean
  /**
   * Default value for the group, written verbatim after `=`.
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
  params: ReadonlyArray<FunctionParameterNode | ParameterGroupNode>
}

/**
 * Union of all function-parameter AST node variants used by the function-parameter printer.
 */
export type FunctionParamNode = FunctionParameterNode | ParameterGroupNode | FunctionParametersNode | ParamsTypeNode

/**
 * Handler map keys — one per `FunctionParamNode` kind.
 */
export type FunctionNodeType = 'functionParameter' | 'parameterGroup' | 'functionParameters' | 'paramsType'

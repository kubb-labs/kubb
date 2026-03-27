import type { BaseNode } from './base.ts'

/**
 * AST node representing a language-agnostic type expression produced during parameter resolution.
 * Each language printer renders the variant into its own syntax.
 *
 * @example Struct (inline object type) — TypeScript: `{ petId: string; name?: string }`
 * @example Struct (inline object type) — Python: `TypedDict` / `dict[str, Any]`
 *
 * @example Member (single field of a group type) — TypeScript: `PathParams['petId']`
 * @example Member (single field of a group type) — C#: `PathParams.PetId`
 */
export type TypeNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Type'
} & (
    | {
        /**
         * Struct variant — an inline anonymous type grouping named fields.
         * TypeScript renders as `{ key: Type; other?: OtherType }`.
         */
        variant: 'struct'
        /**
         * Properties of the struct type.
         */
        properties: Array<{ name: string; optional: boolean; type: string }>
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
   * Type annotation — either a plain string or a {@link TypeNode} for structured type expressions.
   * Omit for untyped output.
   *
   * @example Plain string
   * `"string"` → `petId: string`
   *
   * @example Struct type node (TypeScript)
   * `{ kind: 'Type', variant: 'struct', properties: [...] }` → `{ key: Type; other?: OtherType }`
   *
   * @example Member type node (TypeScript)
   * `{ kind: 'Type', variant: 'member', base: 'PathParams', key: 'petId' }` → `PathParams['petId']`
   */
  type?: string | TypeNode
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
 * AST node for a group of related function parameters treated as a single unit.
 *
 * Each language printer decides how to render this group:
 * - TypeScript/JS: destructured object `{ key1, key2 }: { key1: Type1; key2: Type2 } = {}`
 * - Python: keyword-only args or a typed dict parameter
 * - C# / Kotlin: named record / data-class parameter
 *
 * When `inline` is `true`, the group is "spread" as individual top-level parameters
 * rather than wrapped in a single grouped construct.
 *
 * @example Grouped (TypeScript declaration)
 * `{ id, name }: { id: string; name: string } = {}`
 *
 * @example Inline (spread) — children emitted as individual top-level params
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
  type?: string
  /**
   * When `true`, `properties` are emitted as individual top-level parameters instead of
   * being wrapped in a single grouped construct.
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
  params: Array<FunctionParameterNode | ParameterGroupNode>
}

/**
 * The four function-signature AST node variants.
 */
export type FunctionNode = FunctionParameterNode | ParameterGroupNode | FunctionParametersNode | TypeNode

/**
 * Handler map keys — one per `FunctionNode` kind.
 */
export type FunctionNodeType = 'functionParameter' | 'parameterGroup' | 'functionParameters' | 'type'

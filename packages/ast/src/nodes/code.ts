import type { BaseNode } from './base.ts'

/**
 * JSDoc documentation metadata attached to code declarations.
 */
export type JSDocNode = {
  /**
   * JSDoc comment lines. `undefined` entries are filtered out during rendering.
   * @example ['@description A pet resource', '@deprecated']
   */
  comments?: Array<string | undefined>
}

/**
 * AST node representing a TypeScript `const` declaration.
 *
 * Mirrors the props of the `Const` component from `@kubb/react-fabric`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createConst({ name: 'pet', export: true, asConst: true })
 * // export const pet = ... as const
 * ```
 */
export type ConstNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Const'
  /**
   * Name of the constant declaration.
   */
  name: string
  /**
   * Whether the declaration should be exported.
   * @default false
   */
  export?: boolean
  /**
   * Optional explicit type annotation.
   * @example 'Pet'
   */
  type?: string
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode
  /**
   * Whether to append `as const` to the declaration.
   * @default false
   */
  asConst?: boolean
  /**
   * Child nodes representing the value of the constant (children of the `Const` component).
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a TypeScript type.
 *
 * Covers two use cases in a single discriminated union:
 *
 * - `kind: 'TypeDeclaration'` — a `type X = ...` alias declaration, mirroring the `Type`
 *   component from `@kubb/react-fabric`.
 * - `kind: 'Type'` — a language-agnostic type expression used as a function parameter type
 *   annotation. Comes in three variants: `reference` (plain name), `struct` (inline object
 *   type), `member` (indexed-access type). Each language's printer renders the variant into
 *   its own syntax.
 *
 * @example Type alias declaration
 * ```ts
 * createType({ name: 'Pet', export: true })
 * // export type Pet = ...
 * ```
 *
 * @example Reference type expression
 * ```ts
 * createTypeExpression({ variant: 'reference', name: 'QueryParams' })
 * // QueryParams
 * ```
 *
 * @example Member type expression (TypeScript indexed access)
 * ```ts
 * createTypeExpression({ variant: 'member', base: 'PathParams', key: 'petId' })
 * // PathParams['petId']
 * ```
 */
export type TypeNode = BaseNode &
  (
    | {
        /**
         * Type alias declaration — mirrors the `Type` component from `@kubb/react-fabric`.
         */
        kind: 'TypeDeclaration'
        /**
         * Name of the type alias.
         */
        name: string
        /**
         * Whether the declaration should be exported.
         * @default false
         */
        export?: boolean
        /**
         * JSDoc documentation metadata.
         */
        JSDoc?: JSDocNode
        /**
         * Child nodes representing the type body (children of the `Type` component).
         */
        nodes?: Array<CodeNode>
      }
    | ({
        /**
         * Language-agnostic type expression used in function parameter annotations.
         */
        kind: 'Type'
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
            properties: Array<{ name: string; optional: boolean; type: Extract<TypeNode, { kind: 'Type' }> }>
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
      ))
  )

/**
 * Convenience alias for the declaration variant of {@link TypeNode}.
 * Equivalent to `Extract<TypeNode, { kind: 'TypeDeclaration' }>`.
 */
export type TypeDeclarationNode = Extract<TypeNode, { kind: 'TypeDeclaration' }>

/**
 * AST node representing a TypeScript `function` declaration.
 *
 * Mirrors the props of the `Function` component from `@kubb/react-fabric`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createFunctionDeclaration({ name: 'getPet', export: true, async: true, returnType: 'Pet' })
 * // export async function getPet(): Promise<Pet> { ... }
 * ```
 */
export type FunctionNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'FunctionDeclaration'
  /**
   * Name of the function.
   */
  name: string
  /**
   * Whether the function is a default export.
   * @default false
   */
  default?: boolean
  /**
   * Function parameter list rendered as a string (e.g. from `FunctionParams.toConstructor()`).
   */
  params?: string
  /**
   * Whether the function should be exported.
   * @default false
   */
  export?: boolean
  /**
   * Whether the function is async. When `true`, the return type is wrapped in `Promise<>`.
   * @default false
   */
  async?: boolean
  /**
   * TypeScript generic type parameters.
   * @example ['T', 'U extends string']
   */
  generics?: string | string[]
  /**
   * Return type annotation.
   * @example 'Pet'
   */
  returnType?: string
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode
  /**
   * Child nodes representing the function body (children of the `Function` component).
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a TypeScript arrow function (`const name = () => { ... }`).
 *
 * Mirrors the props of the `Function.Arrow` component from `@kubb/react-fabric`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createArrowFunctionDeclaration({ name: 'getPet', export: true, singleLine: true })
 * // export const getPet = () => ...
 * ```
 */
export type ArrowFunctionNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'ArrowFunctionDeclaration'
  /**
   * Name of the arrow function (used as the `const` variable name).
   */
  name: string
  /**
   * Whether the function is a default export.
   * @default false
   */
  default?: boolean
  /**
   * Function parameter list rendered as a string (e.g. from `FunctionParams.toConstructor()`).
   */
  params?: string
  /**
   * Whether the arrow function should be exported.
   * @default false
   */
  export?: boolean
  /**
   * Whether the arrow function is async. When `true`, the return type is wrapped in `Promise<>`.
   * @default false
   */
  async?: boolean
  /**
   * TypeScript generic type parameters.
   * @example ['T', 'U extends string']
   */
  generics?: string | string[]
  /**
   * Return type annotation.
   * @example 'Pet'
   */
  returnType?: string
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode
  /**
   * Render the arrow function body as a single-line expression.
   * @default false
   */
  singleLine?: boolean
  /**
   * Child nodes representing the function body (children of the `Function.Arrow` component).
   */
  nodes?: Array<CodeNode>
}

/**
 * Union of all code-generation AST nodes.
 *
 * These nodes mirror the JSX components from `@kubb/react-fabric` and are used as
 * structured children in {@link SourceNode.nodes}.
 */
export type CodeNode = ConstNode | TypeNode | FunctionNode | ArrowFunctionNode

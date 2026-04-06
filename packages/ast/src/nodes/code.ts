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
   * Each entry is either a structured {@link CodeNode} or a raw string expression.
   */
  nodes?: Array<CodeNode | string>
}

/**
 * AST node representing a TypeScript `type` alias declaration.
 *
 * Mirrors the props of the `Type` component from `@kubb/react-fabric`.
 * The `children` prop of the component is represented as `nodes`.
 *
 * @example
 * ```ts
 * createType({ name: 'Pet', export: true })
 * // export type Pet = ...
 * ```
 */
export type TypeNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Type'
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
   * Each entry is either a structured {@link CodeNode} or a raw string expression.
   */
  nodes?: Array<CodeNode | string>
}

/**
 * Convenience alias for {@link TypeNode}.
 * @deprecated Use `TypeNode` directly.
 */
export type TypeDeclarationNode = TypeNode

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
  kind: 'Function'
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
   * Each entry is either a structured {@link CodeNode} or a raw string statement.
   */
  nodes?: Array<CodeNode | string>
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
  kind: 'ArrowFunction'
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
   * Each entry is either a structured {@link CodeNode} or a raw string statement.
   */
  nodes?: Array<CodeNode | string>
}

/**
 * Union of all code-generation AST nodes.
 *
 * These nodes mirror the JSX components from `@kubb/react-fabric` and are used as
 * structured children in {@link SourceNode.nodes}.
 */
export type CodeNode = ConstNode | TypeNode | FunctionNode | ArrowFunctionNode

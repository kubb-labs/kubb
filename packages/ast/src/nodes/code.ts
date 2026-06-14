import { defineNode } from '../node.ts'
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
 * Mirrors the props of the `Const` component from `@kubb/renderer-jsx`.
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
  export?: boolean | null
  /**
   * Optional explicit type annotation.
   * @example 'Pet'
   */
  type?: string | null
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null
  /**
   * Whether to append `as const` to the declaration.
   * @default false
   */
  asConst?: boolean | null
  /**
   * Child nodes representing the value of the constant (children of the `Const` component).
   * Each entry is a {@link CodeNode}; use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a TypeScript `type` alias declaration.
 *
 * Mirrors the props of the `Type` component from `@kubb/renderer-jsx`.
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
  export?: boolean | null
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null
  /**
   * Child nodes representing the type body (children of the `Type` component).
   * Each entry is a {@link CodeNode}; use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a TypeScript `function` declaration.
 *
 * Mirrors the props of the `Function` component from `@kubb/renderer-jsx`.
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
  default?: boolean | null
  /**
   * Function parameter list rendered as a string (e.g. from `FunctionParams.toConstructor()`).
   */
  params?: string | null
  /**
   * Whether the function should be exported.
   * @default false
   */
  export?: boolean | null
  /**
   * Whether the function is async. When `true`, the return type is wrapped in `Promise<>`.
   * @default false
   */
  async?: boolean | null
  /**
   * TypeScript generic type parameters.
   * @example ['T', 'U extends string']
   */
  generics?: string | Array<string> | null
  /**
   * Return type annotation.
   * @example 'Pet'
   */
  returnType?: string | null
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null
  /**
   * Child nodes representing the function body (children of the `Function` component).
   * Each entry is a {@link CodeNode}; use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a TypeScript arrow function (`const name = () => { ... }`).
 *
 * Mirrors the props of the `Function.Arrow` component from `@kubb/renderer-jsx`.
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
  default?: boolean | null
  /**
   * Function parameter list rendered as a string (e.g. from `FunctionParams.toConstructor()`).
   */
  params?: string | null
  /**
   * Whether the arrow function should be exported.
   * @default false
   */
  export?: boolean | null
  /**
   * Whether the arrow function is async. When `true`, the return type is wrapped in `Promise<>`.
   * @default false
   */
  async?: boolean | null
  /**
   * TypeScript generic type parameters.
   * @example ['T', 'U extends string']
   */
  generics?: string | Array<string> | null
  /**
   * Return type annotation.
   * @example 'Pet'
   */
  returnType?: string | null
  /**
   * JSDoc documentation metadata.
   */
  JSDoc?: JSDocNode | null
  /**
   * Render the arrow function body as a single-line expression.
   * @default false
   */
  singleLine?: boolean | null
  /**
   * Child nodes representing the function body (children of the `Function.Arrow` component).
   * Each entry is a {@link CodeNode}; use {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>
}

/**
 * AST node representing a raw text/string fragment in the source output.
 *
 * Used instead of bare `string` values so that all entries in `nodes` arrays
 * are typed `CodeNode` objects rather than a mixed `CodeNode | string` union.
 *
 * @example
 * ```ts
 * createText('return fetch(id)')
 * // { kind: 'Text', value: 'return fetch(id)' }
 * ```
 */
export type TextNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Text'
  /**
   * The raw string content.
   */
  value: string
}

/**
 * AST node representing a line break in the source output.
 *
 * Corresponds to `<br/>` in JSX components. When printed, produces an empty
 * string that, joined with `\n` by `printNodes` creates a blank line
 * between surrounding code nodes.
 *
 * @example
 * ```ts
 * createBreak()
 * // { kind: 'Break' }
 * // prints as '' → blank line when surrounded by other nodes
 * ```
 */
export type BreakNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Break'
}

/**
 * AST node representing a raw JSX fragment in the source output.
 *
 * Mirrors the `Jsx` component from `@kubb/renderer-jsx`. Use this to embed raw
 * JSX/TSX markup (including fragments `<>…</>`) directly in generated code.
 *
 * @example
 * ```ts
 * createJsx('<>\n  <a href={href}>Open</a>\n</>')
 * // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
 * ```
 */
export type JsxNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Jsx'
  /**
   * The raw JSX string content.
   */
  value: string
}

/**
 * Union of all code-generation AST nodes.
 *
 * These nodes mirror the JSX components from `@kubb/renderer-jsx` and are used as
 * structured children in {@link SourceNode.nodes}.
 */
export type CodeNode = ConstNode | TypeNode | FunctionNode | ArrowFunctionNode | TextNode | BreakNode | JsxNode

/**
 * Definition for the {@link ConstNode}.
 */
export const constDef = defineNode<ConstNode>({ kind: 'Const' })

/**
 * Creates a `ConstNode` representing a TypeScript `const` declaration.
 *
 * @example Exported constant with type and `as const`
 * ```ts
 * createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true })
 * // export const pets: Pet[] = ... as const
 * ```
 */
export const createConst = constDef.create

/**
 * Definition for the {@link TypeNode}.
 */
export const typeDef = defineNode<TypeNode>({ kind: 'Type' })

/**
 * Creates a `TypeNode` representing a TypeScript `type` alias declaration.
 *
 * @example
 * ```ts
 * createType({ name: 'Pet', export: true })
 * // export type Pet = ...
 * ```
 */
export const createType = typeDef.create

/**
 * Definition for the {@link FunctionNode}.
 */
export const functionDef = defineNode<FunctionNode>({ kind: 'Function' })

/**
 * Creates a `FunctionNode` representing a TypeScript `function` declaration.
 *
 * @example
 * ```ts
 * createFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
 * // export async function fetchPet(): Promise<Pet> { ... }
 * ```
 */
export const createFunction = functionDef.create

/**
 * Definition for the {@link ArrowFunctionNode}.
 */
export const arrowFunctionDef = defineNode<ArrowFunctionNode>({ kind: 'ArrowFunction' })

/**
 * Creates an `ArrowFunctionNode` representing a TypeScript arrow function.
 *
 * @example
 * ```ts
 * createArrowFunction({ name: 'double', export: true, params: 'n: number', singleLine: true })
 * // export const double = (n: number) => ...
 * ```
 */
export const createArrowFunction = arrowFunctionDef.create

/**
 * Definition for the {@link TextNode}.
 */
export const textDef = defineNode<TextNode, string>({ kind: 'Text', build: (value) => ({ value }) })

/**
 * Creates a {@link TextNode} representing a raw string fragment in the source output.
 *
 * @example
 * ```ts
 * createText('return fetch(id)')
 * // { kind: 'Text', value: 'return fetch(id)' }
 * ```
 */
export const createText = textDef.create

/**
 * Definition for the {@link BreakNode}.
 */
export const breakDef = defineNode<BreakNode, void>({ kind: 'Break', build: () => ({}) })

/**
 * Creates a {@link BreakNode} representing a line break in the source output.
 *
 * @example
 * ```ts
 * createBreak()
 * // { kind: 'Break' }
 * ```
 */
export function createBreak(): BreakNode {
  return breakDef.create()
}

/**
 * Definition for the {@link JsxNode}.
 */
export const jsxDef = defineNode<JsxNode, string>({ kind: 'Jsx', build: (value) => ({ value }) })

/**
 * Creates a {@link JsxNode} representing a raw JSX fragment in the source output.
 *
 * @example
 * ```ts
 * createJsx('<>\n  <a href={href}>Open</a>\n</>')
 * // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
 * ```
 */
export const createJsx = jsxDef.create

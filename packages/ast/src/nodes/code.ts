import { type BaseNode, nodeFactory } from './base.ts'

/** JSDoc documentation metadata attached to code declarations. */
export type JSDocNode = {
  /** JSDoc comment lines. `undefined` entries are filtered out during rendering. */
  comments?: Array<string | undefined>
}

/**
 * A TypeScript `const` declaration. Mirrors the props of the `Const` component from
 * `@kubb/renderer-jsx`; the component's `children` are represented as `nodes`.
 */
export type ConstNode = BaseNode & {
  kind: 'Const'
  name: string
  export?: boolean | null
  /** Explicit type annotation, for example `'Pet'`. */
  type?: string | null
  JSDoc?: JSDocNode | null
  /** Whether to append `as const` to the declaration. */
  asConst?: boolean | null
  /** Value of the constant. Use {@link TextNode} for raw string content. */
  nodes?: Array<CodeNode>
}

/**
 * A TypeScript `type` alias declaration. Mirrors the props of the `Type` component from
 * `@kubb/renderer-jsx`; the component's `children` are represented as `nodes`.
 */
export type TypeNode = BaseNode & {
  kind: 'Type'
  name: string
  export?: boolean | null
  JSDoc?: JSDocNode | null
  /** Type body. Use {@link TextNode} for raw string content. */
  nodes?: Array<CodeNode>
}

/**
 * A TypeScript `function` declaration. Mirrors the props of the `Function` component from
 * `@kubb/renderer-jsx`; the component's `children` are represented as `nodes`.
 */
export type FunctionNode = BaseNode & {
  kind: 'Function'
  name: string
  /** Whether the function is a default export. */
  default?: boolean | null
  /** Parameter list written verbatim between the parentheses, for example `'id: string, config: Config = {}'`. */
  params?: string | null
  export?: boolean | null
  /** When `true`, the return type is wrapped in `Promise<>`. */
  async?: boolean | null
  /** Generic type parameters, for example `['T', 'U extends string']`. */
  generics?: string | Array<string> | null
  returnType?: string | null
  JSDoc?: JSDocNode | null
  /** Function body. Use {@link TextNode} for raw string content. */
  nodes?: Array<CodeNode>
}

/** An arrow function (`const name = () => { ... }`). Mirrors the `Function.Arrow` component from `@kubb/renderer-jsx`. */
export type ArrowFunctionNode = Omit<FunctionNode, 'kind'> & {
  kind: 'ArrowFunction'
  /** Render the body as a single-line expression. */
  singleLine?: boolean | null
}

/** A raw string fragment, so every entry of a `nodes` array is a `CodeNode` instead of `CodeNode | string`. */
export type TextNode = BaseNode & {
  kind: 'Text'
  value: string
}

/**
 * A blank line in the source output (`<br/>` in JSX). `printNodes` turns a `Break` between two
 * statements into one blank line; consecutive, leading, and trailing breaks are folded away.
 */
export type BreakNode = BaseNode & {
  kind: 'Break'
}

/** A raw JSX/TSX fragment embedded in generated code. Mirrors the `Jsx` component from `@kubb/renderer-jsx`. */
export type JsxNode = BaseNode & {
  kind: 'Jsx'
  value: string
}

/** Union of all code-generation nodes, used as structured children in {@link SourceNode.nodes}. */
export type CodeNode = ConstNode | TypeNode | FunctionNode | ArrowFunctionNode | TextNode | BreakNode | JsxNode

export const createConst = nodeFactory<ConstNode>('Const')
export const createType = nodeFactory<TypeNode>('Type')
export const createFunction = nodeFactory<FunctionNode>('Function')
export const createArrowFunction = nodeFactory<ArrowFunctionNode>('ArrowFunction')

export function createText(value: string): TextNode {
  return { kind: 'Text', value }
}

export function createBreak(): BreakNode {
  return { kind: 'Break' }
}

export function createJsx(value: string): JsxNode {
  return { kind: 'Jsx', value }
}

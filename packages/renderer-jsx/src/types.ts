import type { ArrowFunctionNode, ConstNode, ExportNode, FileNode, FunctionNode, ImportNode, SourceNode, TypeNode } from '@kubb/ast'

/**
 * Unique key for a Kubb JSX element in lists or conditional renders.
 */
export type Key = string | number | bigint

/**
 * Element produced by a Kubb JSX component. It carries the host or component
 * `type`, its `props`, and an optional list `key`. The renderer walks these at
 * runtime, so the fields stay opaque to type-checking.
 */
export type KubbReactElement = {
  type: unknown
  props: unknown
  key: Key | null
}

/**
 * Anything a Kubb JSX component accepts as children: an element, a primitive
 * rendered as text, a nullish value that is skipped, or an iterable of nodes.
 */
export type KubbReactNode = KubbReactElement | string | number | bigint | boolean | null | undefined | Iterable<KubbReactNode>

/**
 * Props for the `<kubb-jsx>` element.
 * Embeds a raw JSX string verbatim in generated output.
 */
export type KubbJsxProps = {
  children?: string
}

/**
 * Props for the `<kubb-file>` element.
 * Represents a generated file.
 */
export type KubbFileProps = {
  id?: string | null
  children?: KubbReactNode
  baseName: string
  path: string
  override?: boolean | null
  meta?: FileNode['meta'] | null
}

/**
 * Props for the `<kubb-source>` element.
 * Marks a block of source text associated with a file.
 */
export type KubbSourceProps = Omit<SourceNode, 'kind'> & {
  children?: KubbReactNode
}

/**
 * Props for the `<kubb-import>` element.
 * Declares an import statement in the generated file.
 */
export type KubbImportProps = Omit<ImportNode, 'kind'> & {}

/**
 * Props for the `<kubb-export>` element.
 * Declares an export statement in the generated file.
 */
export type KubbExportProps = Omit<ExportNode, 'kind'> & {}

/**
 * Props for the `<kubb-function>` element.
 * Generates a function declaration.
 */
export type KubbFunctionProps = Omit<FunctionNode, 'kind'> & {
  children?: KubbReactNode
}

/**
 * Props for the `<kubb-arrow-function>` element.
 * Generates an arrow function declaration.
 */
export type KubbArrowFunctionProps = Omit<ArrowFunctionNode, 'kind'> & {
  children?: KubbReactNode
}

/**
 * Props for the `<kubb-const>` element.
 * Generates a constant declaration.
 */
export type KubbConstProps = Omit<ConstNode, 'kind'> & {
  children?: KubbReactNode
}

/**
 * Props for the `<kubb-type>` element.
 * Generates a TypeScript type alias declaration.
 */
export type KubbTypeProps = Omit<TypeNode, 'kind'> & {
  children?: KubbReactNode
}

/**
 * Props for the `<br>` element. It emits a single line break and takes no
 * attributes of its own.
 */
export type LineBreakProps = {}

/**
 * JSDoc comment block to attach to a generated declaration.
 * Each string in `comments` becomes one line inside the `/** … *\/` block.
 *
 * @example
 * ```ts
 * { comments: ['@description A pet object.', '@deprecated Use PetV2 instead.'] }
 * // Emits:
 * // /**
 * //  * @description A pet object.
 * //  * @deprecated Use PetV2 instead.
 * //  *\/
 * ```
 */
export type JSDoc = {
  /**
   * Lines to emit inside the JSDoc block, in source order.
   * Use standard JSDoc tags such as `@description`, `@deprecated`, `@see`, etc.
   */
  comments: Array<string>
}

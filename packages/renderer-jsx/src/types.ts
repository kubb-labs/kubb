import type { ArrowFunctionNode, ConstNode, ExportNode, FileNode, FunctionNode, ImportNode, SourceNode, TypeNode } from '@kubb/ast'
import type React from 'react'
import type { JSX, ReactNode } from 'react'

/**
 * Unique identifier for a React element in lists or conditional renders.
 */
export type Key = string | number | bigint

/**
 * Custom element names recognized by the Kubb JSX renderer.
 * Each name maps to a corresponding AST node type in the generated code.
 */
export type ElementNames =
  | 'br'
  | 'div'
  | 'indent'
  | 'dedent'
  | 'kubb-jsx'
  | 'kubb-text'
  | 'kubb-file'
  | 'kubb-source'
  | 'kubb-import'
  | 'kubb-export'
  | 'kubb-function'
  | 'kubb-arrow-function'
  | 'kubb-const'
  | 'kubb-type'
  | 'kubb-root'
  | 'kubb-app'

type Node = {
  parentNode: DOMElement | undefined
  internal_static?: boolean
}

/**
 * Allowed attribute value types for DOM elements.
 */
export type DOMNodeAttribute = boolean | string | number | Record<string, unknown> | Array<unknown>

type TextName = '#text'

/**
 * Leaf DOM node containing raw text.
 */
export type TextNode = {
  nodeName: TextName
  nodeValue: string
} & Node

/**
 * Virtual DOM node — either a text node or a named element.
 */
export type DOMNode<T = { nodeName: NodeNames }> = T extends {
  nodeName: infer U
}
  ? U extends '#text'
    ? TextNode
    : DOMElement
  : never

type OutputTransformer = (s: string, index: number) => string

/**
 * Named element in the Kubb virtual DOM tree.
 * Stores attributes, child nodes, and lifecycle callbacks for rendering.
 */
export type DOMElement = {
  nodeName: ElementNames
  /**
   * Key/value attributes passed as JSX props to this element.
   */
  attributes: Map<string, DOMNodeAttribute>
  /**
   * Ordered list of child nodes attached to this element.
   */
  childNodes: DOMNode[]
  internal_transform?: OutputTransformer

  // Internal properties
  isStaticDirty?: boolean
  staticNode?: DOMElement
  onComputeLayout?: () => void
  onRender?: () => void
  onImmediateRender?: () => void
} & Node

type NodeNames = ElementNames | TextName

/**
 * React node type for Kubb JSX components.
 */
export type KubbReactNode = ReactNode

/**
 * React element type returned by Kubb JSX components.
 */
export type KubbReactElement = JSX.Element

/**
 * Props for the `<kubb-jsx>` element.
 * Embeds a raw JSX string verbatim in generated output.
 */
export type KubbJsxProps = {
  children?: string
}

/**
 * Props for the `<kubb-text>` element.
 * Wraps React children as plain text in the output.
 */
export type KubbTextProps = {
  children?: KubbReactNode
}

/**
 * Props for the `<kubb-file>` element.
 * Represents a generated file.
 */
export type KubbFileProps = {
  id?: string
  children?: KubbReactNode
  baseName: string
  path: string
  override?: boolean
  meta?: FileNode['meta']
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
 * Props for the HTML `<br>` element.
 */
export type LineBreakProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>

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

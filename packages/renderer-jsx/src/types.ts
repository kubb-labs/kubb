import type { ConstNode, ExportNode, FileNode, FunctionNode, ImportNode, SourceNode, TypeNode } from '@kubb/ast/types'
import type React from 'react'
import type { JSX, ReactNode } from 'react'

export type Key = string | number | bigint

export type ElementNames =
  | 'br'
  | 'div'
  | 'indent'
  | 'dedent'
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

export type DOMNodeAttribute = boolean | string | number | Record<string, unknown>

type TextName = '#text'
export type TextNode = {
  nodeName: TextName
  nodeValue: string
} & Node

export type DOMNode<T = { nodeName: NodeNames }> = T extends {
  nodeName: infer U
}
  ? U extends '#text'
    ? TextNode
    : DOMElement
  : never

type OutputTransformer = (s: string, index: number) => string

export type DOMElement = {
  nodeName: ElementNames
  attributes: Map<string, DOMNodeAttribute>
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

export type KubbReactNode = ReactNode
export type KubbReactElement = JSX.Element

export type KubbTextProps = {
  children?: KubbReactNode
}

export type KubbFileProps = {
  id?: string
  children?: KubbReactNode
  baseName: string
  path: string
  override?: boolean
  meta?: FileNode['meta']
}
export type KubbSourceProps = Omit<SourceNode, 'kind'> & {
  children?: KubbReactNode
}

export type KubbImportProps = Omit<ImportNode, 'kind'> & {}

export type KubbExportProps = Omit<ExportNode, 'kind'> & {}

export type KubbFunctionProps = Omit<FunctionNode, 'kind'> & {
  children?: KubbReactNode
}

export type KubbConstProps = Omit<ConstNode, 'kind'> & {
  children?: KubbReactNode
}

export type KubbTypeProps = Omit<TypeNode, 'kind'> & {
  children?: KubbReactNode
}

export type LineBreakProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>

export type JSDoc = {
  comments: string[]
}

type ReactElementNames = 'br'

export type ElementNames = ReactElementNames | 'kubb-text' | 'kubb-import' | 'kubb-export' | 'kubb-root' | 'kubb-app'

export type Node = {
  parentNode: DOMElement | undefined
  internal_static?: boolean
}

export type DOMNodeAttribute = boolean | string | number

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
  attributes: Record<string, DOMNodeAttribute>
  childNodes: DOMNode[]
  internal_transform?: OutputTransformer

  // Internal properties
  isStaticDirty?: boolean
  staticNode?: DOMElement
  onComputeLayout?: () => void
  onRender?: () => void
  onImmediateRender?: () => void
} & Node

export type NodeNames = ElementNames | TextName

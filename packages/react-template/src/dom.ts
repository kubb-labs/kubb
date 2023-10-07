import Yoga from 'yoga-wasm-web/auto'
import type { Node as YogaNode } from 'yoga-wasm-web/auto'
import type { ElementNames } from './types.ts'

export type OutputTransformer = (s: string, index: number) => string

type Node = {
  parentNode: DOMElement | undefined
  yogaNode?: YogaNode
  internal_static?: boolean
}

export type TextName = '#text'

export type NodeNames = ElementNames | TextName

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

export type DOMNodeAttribute = boolean | string | number

export const createNode = (nodeName: ElementNames): DOMElement => {
  const node: DOMElement = {
    nodeName,
    attributes: {},
    childNodes: [],
    parentNode: undefined,
    yogaNode: Yoga.Node.create(),
  }

  return node
}

export const appendChildNode = (node: DOMElement, childNode: DOMElement): void => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode)
  }

  childNode.parentNode = node
  node.childNodes.push(childNode)

  if (childNode.yogaNode) {
    node.yogaNode?.insertChild(childNode.yogaNode, node.yogaNode.getChildCount())
  }

  if (node.nodeName === 'kubb-text') {
    markNodeAsDirty(node)
  }
}

export const insertBeforeNode = (node: DOMElement, newChildNode: DOMNode, beforeChildNode: DOMNode): void => {
  if (newChildNode.parentNode) {
    removeChildNode(newChildNode.parentNode, newChildNode)
  }

  newChildNode.parentNode = node

  const index = node.childNodes.indexOf(beforeChildNode)
  if (index >= 0) {
    node.childNodes.splice(index, 0, newChildNode)
    if (newChildNode.yogaNode) {
      node.yogaNode?.insertChild(newChildNode.yogaNode, index)
    }

    return
  }

  node.childNodes.push(newChildNode)

  if (newChildNode.yogaNode) {
    node.yogaNode?.insertChild(newChildNode.yogaNode, node.yogaNode.getChildCount())
  }

  if (node.nodeName === 'kubb-text') {
    markNodeAsDirty(node)
  }
}

export const removeChildNode = (node: DOMElement, removeNode: DOMNode): void => {
  if (removeNode.yogaNode) {
    removeNode.parentNode?.yogaNode?.removeChild(removeNode.yogaNode)
  }

  removeNode.parentNode = undefined

  const index = node.childNodes.indexOf(removeNode)
  if (index >= 0) {
    node.childNodes.splice(index, 1)
  }

  if (node.nodeName === 'kubb-text') {
    markNodeAsDirty(node)
  }
}

export const setAttribute = (node: DOMElement, key: string, value: DOMNodeAttribute): void => {
  node.attributes[key] = value
}

export const createTextNode = (text: string): TextNode => {
  const node: TextNode = {
    nodeName: '#text',
    nodeValue: text,
    yogaNode: undefined,
    parentNode: undefined,
  }

  setTextNodeValue(node, text)

  return node
}

const findClosestYogaNode = (node?: DOMNode): YogaNode | undefined => {
  if (!node?.parentNode) {
    return undefined
  }

  return node.yogaNode ?? findClosestYogaNode(node.parentNode)
}

const markNodeAsDirty = (node?: DOMNode): void => {
  // Mark closest Yoga node as dirty to measure text dimensions again
  const yogaNode = findClosestYogaNode(node)
  yogaNode?.markDirty()
}

export const setTextNodeValue = (node: TextNode, text: string): void => {
  if (typeof text !== 'string') {
    text = String(text)
  }

  node.nodeValue = text
  markNodeAsDirty(node)
}

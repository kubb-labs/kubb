import type { DOMElement, DOMNode, DOMNodeAttribute, ElementNames, TextNode } from './types.ts'

export const createNode = (nodeName: string): DOMElement => {
  const node: DOMElement = {
    nodeName: nodeName as DOMElement['nodeName'],
    attributes: new Map(),
    childNodes: [],
    parentNode: undefined,
  }

  return node
}

export const appendChildNode = (node: DOMNode, childNode: DOMElement | DOMNode): void => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode)
  }

  if (node.nodeName !== '#text') {
    childNode.parentNode = node
    node.childNodes.push(childNode)
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

    return
  }

  node.childNodes.push(newChildNode)
}

export const removeChildNode = (node: DOMElement, removeNode: DOMNode): void => {
  removeNode.parentNode = undefined

  const index = node.childNodes.indexOf(removeNode)
  if (index >= 0) {
    node.childNodes.splice(index, 1)
  }
}

export const setAttribute = (node: DOMElement, key: string, value: DOMNodeAttribute): void => {
  node.attributes.set(key, value)
}

export const createTextNode = (text: string): TextNode => {
  const node: TextNode = {
    nodeName: '#text',
    nodeValue: text,
    parentNode: undefined,
  }

  setTextNodeValue(node, text)

  return node
}

export const setTextNodeValue = (node: TextNode, text: string): void => {
  if (typeof text !== 'string') {
    text = String(text)
  }

  node.nodeValue = text
}

export const nodeNames = new Set<ElementNames>([
  'kubb-export',
  'kubb-file',
  'kubb-source',
  'kubb-import',
  'kubb-function',
  'kubb-arrow-function',
  'kubb-const',
  'kubb-type',
  'kubb-jsx',
  'kubb-text',
  'kubb-root',
  'kubb-app',
  'br',
  'indent',
  'dedent',
])

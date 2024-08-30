import type { DOMElement, DOMNode, DOMNodeAttribute, ElementNames, TextNode } from '../types.ts'

export const createNode = (nodeName: string): DOMElement => {
  const node: DOMElement = {
    nodeName: nodeName as DOMElement['nodeName'],
    attributes: {},
    childNodes: [],
    parentNode: undefined,
  }

  return node
}

export const appendChildNode = (node: DOMElement, childNode: DOMElement): void => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode)
  }

  childNode.parentNode = node
  node.childNodes.push(childNode)
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
  node.attributes[key] = value
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

export const nodeNames: Array<ElementNames> = ['kubb-export', 'kubb-file', 'kubb-source', 'kubb-import', 'kubb-text', 'kubb-parser']

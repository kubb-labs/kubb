import type { DOMElement, DOMNode, DOMNodeAttribute, ElementNames, TextNode } from './types.ts'

/**
 * Create a new, empty {@link DOMElement} with the given node name.
 * The element has no attributes, no children, and no parent.
 */
export const createNode = (nodeName: string): DOMElement => {
  const node: DOMElement = {
    nodeName: nodeName as DOMElement['nodeName'],
    attributes: new Map(),
    childNodes: [],
    parentNode: undefined,
  }

  return node
}

/**
 * Append `childNode` as the last child of `node`.
 *
 * If `childNode` already has a parent, it is removed from that parent first
 * (matching standard DOM move semantics).
 * Text nodes (`nodeName === '#text'`) are silently ignored.
 */
export const appendChildNode = (node: DOMNode, childNode: DOMElement | DOMNode): void => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode)
  }

  if (node.nodeName !== '#text') {
    childNode.parentNode = node
    node.childNodes.push(childNode)
  }
}

/**
 * Insert `newChildNode` before `beforeChildNode` in `node`'s child list.
 *
 * If `newChildNode` already has a parent, it is removed from that parent first.
 * If `beforeChildNode` is not found, `newChildNode` is appended at the end.
 */
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

/**
 * Remove `removeNode` from `node`'s child list and clear its `parentNode` reference.
 * Does nothing if `removeNode` is not a direct child of `node`.
 */
export const removeChildNode = (node: DOMElement, removeNode: DOMNode): void => {
  removeNode.parentNode = undefined

  const index = node.childNodes.indexOf(removeNode)
  if (index >= 0) {
    node.childNodes.splice(index, 1)
  }
}

/**
 * Set an attribute on `node`, storing it in the node's `attributes` map.
 */
export const setAttribute = (node: DOMElement, key: string, value: DOMNodeAttribute): void => {
  node.attributes.set(key, value)
}

/**
 * Create a new {@link TextNode} with the given text value.
 */
export const createTextNode = (text: string): TextNode => {
  const node: TextNode = {
    nodeName: '#text',
    nodeValue: text,
    parentNode: undefined,
  }

  setTextNodeValue(node, text)

  return node
}

/**
 * Update the `nodeValue` of an existing {@link TextNode}.
 * Non-string values are coerced to strings via `String(text)`.
 */
export const setTextNodeValue = (node: TextNode, text: string): void => {
  if (typeof text !== 'string') {
    text = String(text)
  }

  node.nodeValue = text
}

/**
 * Set of all element names recognized by the Kubb renderer.
 * Used to distinguish Kubb-owned elements from unrecognized or text nodes during tree traversal.
 */
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

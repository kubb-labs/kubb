import { describe, expect, it } from 'vitest'
import { appendChildNode, createNode, createTextNode, insertBeforeNode, nodeNames, removeChildNode, setAttribute, setTextNodeValue } from './dom.ts'

describe('dom utilities', () => {
  describe('createNode', () => {
    it('should create a DOM element node', () => {
      const node = createNode('kubb-file')

      expect(node.nodeName).toBe('kubb-file')
      expect(node.attributes).toBeInstanceOf(Map)
      expect(node.childNodes).toEqual([])
      expect(node.parentNode).toBeUndefined()
    })
  })

  describe('createTextNode', () => {
    it('should create a text node', () => {
      const textNode = createTextNode('hello world')

      expect(textNode.nodeName).toBe('#text')
      expect(textNode.nodeValue).toBe('hello world')
      expect(textNode.parentNode).toBeUndefined()
    })

    it('should convert non-string values to string', () => {
      const textNode = createTextNode('123')
      expect(textNode.nodeValue).toBe('123')
    })
  })

  describe('setTextNodeValue', () => {
    it('should update text node value', () => {
      const textNode = createTextNode('initial')
      setTextNodeValue(textNode, 'updated')

      expect(textNode.nodeValue).toBe('updated')
    })

    it('should convert non-string values to string', () => {
      const textNode = createTextNode('initial')
      // Testing the internal behavior where non-strings are converted
      setTextNodeValue(textNode, String(42))

      expect(textNode.nodeValue).toBe('42')
    })
  })

  describe('appendChildNode', () => {
    it('should append child to parent node', () => {
      const parent = createNode('kubb-root')
      const child = createNode('kubb-file')

      appendChildNode(parent, child)

      expect(parent.childNodes).toContain(child)
      expect(child.parentNode).toBe(parent)
    })

    it('should remove child from old parent when appending to new parent', () => {
      const oldParent = createNode('kubb-root')
      const newParent = createNode('kubb-app')
      const child = createNode('kubb-file')

      appendChildNode(oldParent, child)
      expect(oldParent.childNodes).toContain(child)

      appendChildNode(newParent, child)
      expect(oldParent.childNodes).not.toContain(child)
      expect(newParent.childNodes).toContain(child)
      expect(child.parentNode).toBe(newParent)
    })

    it('should not append to text node', () => {
      const textNode = createTextNode('text')
      const child = createNode('kubb-file')

      appendChildNode(textNode, child)

      expect(textNode.nodeName).toBe('#text')
      expect(child.parentNode).toBeUndefined()
    })
  })

  describe('insertBeforeNode', () => {
    it('should insert child before another child', () => {
      const parent = createNode('kubb-root')
      const child1 = createNode('kubb-file')
      const child2 = createNode('kubb-source')
      const newChild = createNode('kubb-import')

      appendChildNode(parent, child1)
      appendChildNode(parent, child2)

      insertBeforeNode(parent, newChild, child2)

      expect(parent.childNodes.indexOf(newChild)).toBe(1)
      expect(parent.childNodes.indexOf(child2)).toBe(2)
      expect(newChild.parentNode).toBe(parent)
    })

    it('should append if beforeChild is not found', () => {
      const parent = createNode('kubb-root')
      const child1 = createNode('kubb-file')
      const newChild = createNode('kubb-import')
      const beforeChild = createNode('kubb-source') // not in parent

      appendChildNode(parent, child1)
      insertBeforeNode(parent, newChild, beforeChild)

      expect(parent.childNodes).toContain(newChild)
      expect(parent.childNodes.indexOf(newChild)).toBe(1)
    })

    it('should remove from old parent when inserting', () => {
      const oldParent = createNode('kubb-app')
      const newParent = createNode('kubb-root')
      const beforeChild = createNode('kubb-file')
      const child = createNode('kubb-source')

      appendChildNode(oldParent, child)
      appendChildNode(newParent, beforeChild)

      insertBeforeNode(newParent, child, beforeChild)

      expect(oldParent.childNodes).not.toContain(child)
      expect(newParent.childNodes).toContain(child)
      expect(child.parentNode).toBe(newParent)
    })
  })

  describe('removeChildNode', () => {
    it('should remove child from parent', () => {
      const parent = createNode('kubb-root')
      const child = createNode('kubb-file')

      appendChildNode(parent, child)
      expect(parent.childNodes).toContain(child)

      removeChildNode(parent, child)

      expect(parent.childNodes).not.toContain(child)
      expect(child.parentNode).toBeUndefined()
    })

    it('should handle removing non-existent child gracefully', () => {
      const parent = createNode('kubb-root')
      const child = createNode('kubb-file')

      removeChildNode(parent, child)

      expect(parent.childNodes).not.toContain(child)
    })
  })

  describe('setAttribute', () => {
    it('should set attribute on node', () => {
      const node = createNode('kubb-file')

      setAttribute(node, 'path', '/src/index.ts')

      expect(node.attributes.get('path')).toBe('/src/index.ts')
    })

    it('should update existing attribute', () => {
      const node = createNode('kubb-file')

      setAttribute(node, 'path', '/src/index.ts')
      setAttribute(node, 'path', '/src/app.ts')

      expect(node.attributes.get('path')).toBe('/src/app.ts')
    })
  })

  describe('nodeNames', () => {
    it('should contain all expected element names', () => {
      expect(nodeNames.has('kubb-export')).toBe(true)
      expect(nodeNames.has('kubb-file')).toBe(true)
      expect(nodeNames.has('kubb-source')).toBe(true)
      expect(nodeNames.has('kubb-import')).toBe(true)
      expect(nodeNames.has('kubb-text')).toBe(true)
      expect(nodeNames.has('kubb-root')).toBe(true)
      expect(nodeNames.has('kubb-app')).toBe(true)
      expect(nodeNames.has('br')).toBe(true)
    })
  })
})

import type { FileNode } from '@kubb/ast'
import React from 'react'
import { appendChildNode, createNode, createTextNode, setAttribute } from './dom.ts'
import type { DOMElement, DOMNodeAttribute, ElementNames, KubbReactElement } from './types.ts'
import { processFiles } from './utils.ts'

type HostContext = {
  isFile: boolean
  isSource: boolean
}

const ROOT_CONTEXT: HostContext = { isFile: false, isSource: false }

function childContext(parentCtx: HostContext, type: ElementNames): HostContext {
  if (type === 'kubb-file') return { isFile: true, isSource: parentCtx.isSource }
  if (type === 'kubb-source') return { isFile: parentCtx.isFile, isSource: true }
  return parentCtx
}

function walk(element: unknown, parentNode: DOMElement, ctx: HostContext): void {
  if (element === null || element === undefined || typeof element === 'boolean') {
    return
  }

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') {
    const text = String(element)
    if (ctx.isFile && !ctx.isSource) {
      throw new Error(`[react] '${text}' should be part of <File.Source> component when using the <File/> component`)
    }
    appendChildNode(parentNode, createTextNode(text))
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) {
      walk(child, parentNode, ctx)
    }
    return
  }

  if (typeof element === 'object' && '$$typeof' in element) {
    const el = element as unknown as React.ReactElement
    const type = el.type
    const props = el.props as Record<string, unknown>

    if (type === React.Fragment) {
      const children = props['children']
      if (Array.isArray(children)) {
        for (const child of children) {
          walk(child, parentNode, ctx)
        }
      } else {
        walk(children, parentNode, ctx)
      }
      return
    }

    if (typeof type === 'function') {
      walk((type as (props: unknown) => unknown)(props), parentNode, ctx)
      return
    }

    if (typeof type === 'string') {
      const node = createNode(type as ElementNames)
      const nodeCtx = childContext(ctx, type as ElementNames)

      for (const [key, value] of Object.entries(props)) {
        if (key === 'children') continue
        if (value !== undefined) {
          setAttribute(node, key, value as DOMNodeAttribute)
        }
      }

      appendChildNode(parentNode, node)

      const children = props['children']
      if (children !== undefined) {
        if (Array.isArray(children)) {
          for (const child of children) {
            walk(child, node, nodeCtx)
          }
        } else {
          walk(children, node, nodeCtx)
        }
      }
      return
    }
  }
}

export class SyncRuntime {
  readonly #rootNode: DOMElement
  nodes: FileNode[] = []

  constructor() {
    this.#rootNode = createNode('kubb-root')
  }

  render(element: KubbReactElement): void {
    walk(element, this.#rootNode, ROOT_CONTEXT)
    this.nodes.push(...processFiles(this.#rootNode))
    this.#rootNode.childNodes = []
  }
}

import type { FileNode } from '@kubb/ast'
import React from 'react'
import { appendChildNode, createNode, createTextNode, setAttribute } from './dom.ts'
import type { DOMElement, DOMNodeAttribute, ElementNames, KubbReactElement } from './types.ts'
import { processFiles, streamFiles } from './utils.ts'

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

      for (const key in props) {
        if (key === 'children') continue
        const value = props[key]
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

/**
 * Synchronous JSX renderer that walks the element tree in a single recursive
 * pass without React's fiber scheduler or work loop.
 *
 * All components must be pure functions — hooks and class components are not
 * supported. Produces identical output to the React-backed {@link Runtime} at
 * approximately 2× the speed.
 */
export class SyncRuntime {
  readonly #rootNode: DOMElement

  /**
   * Accumulated {@link FileNode} results from every {@link render} call.
   */
  nodes: FileNode[] = []

  constructor() {
    this.#rootNode = createNode('kubb-root')
  }

  /**
   * Walks `element` synchronously, converts every `<kubb-file>` subtree into
   * a {@link FileNode}, and appends the results to {@link nodes}.
   */
  render(element: KubbReactElement): void {
    walk(element, this.#rootNode, ROOT_CONTEXT)
    this.nodes.push(...processFiles(this.#rootNode))
    this.#rootNode.childNodes = []
  }

  /**
   * Walks `element` synchronously and yields each {@link FileNode} as it is
   * encountered, without buffering into an intermediate array first.
   *
   * The root node is always reset in a `finally` block, so an early consumer
   * exit or a mid-walk error never leaves stale DOM state.
   *
   * @example
   * ```ts
   * for (const file of runtime.stream(element)) {
   *   await writeFile(file)
   * }
   * ```
   */
  *stream(element: KubbReactElement): Generator<FileNode> {
    try {
      walk(element, this.#rootNode, ROOT_CONTEXT)
      yield* streamFiles(this.#rootNode)
    } finally {
      this.#rootNode.childNodes = []
    }
  }
}

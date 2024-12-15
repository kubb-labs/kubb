import createReconciler from 'react-reconciler'

import { DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants'

import { appendChildNode, createNode, createTextNode, insertBeforeNode, removeChildNode, setAttribute, setTextNodeValue } from './dom.ts'

import type { DOMElement, DOMNodeAttribute, ElementNames, TextNode } from './types.ts'

// https://github.com/pmndrs/react-three-fiber/blob/v9/packages/fiber/src/core/reconciler.tsx
declare module 'react-reconciler/constants' {
  const NoEventPriority = 0
}

const diff = (before: Record<string, unknown>, after: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (before === after) {
    return
  }

  if (!before) {
    return after
  }

  const changed: Record<string, unknown> = {}
  let isChanged = false

  for (const key of Object.keys(before)) {
    const isDeleted = after ? !Object.hasOwnProperty.call(after, key) : true

    if (isDeleted) {
      changed[key] = undefined
      isChanged = true
    }
  }

  if (after) {
    for (const key of Object.keys(after)) {
      if (after[key] !== before[key]) {
        changed[key] = after[key]
        isChanged = true
      }
    }
  }

  return isChanged ? changed : undefined
}

type Props = Record<string, unknown>

type HostContext = {
  type: ElementNames
  isFile: boolean
  isSource: boolean
}

type UpdatePayload = {
  props: Props | undefined
}

let currentUpdatePriority = NoEventPriority

/**
 * @link https://www.npmjs.com/package/react-devtools-inline
 * @link https://github.com/nitin42/Making-a-custom-React-renderer/blob/master/part-one.md
 * @link https://github.com/facebook/react/tree/main/packages/react-reconciler#practical-examples
 * @link https://github.com/vadimdemedes/ink
 * @link https://github.com/pixijs/pixi-react/tree/main/packages
 */
export const KubbRenderer = createReconciler<
  ElementNames,
  Props,
  DOMElement,
  DOMElement,
  TextNode,
  DOMElement,
  unknown,
  unknown,
  HostContext,
  UpdatePayload,
  unknown,
  unknown,
  unknown
>({
  getRootHostContext: () => ({
    type: 'kubb-root',
    isFile: false,
    isSource: false,
  }),
  prepareForCommit: () => null,
  preparePortalMount: () => null,
  clearContainer: () => false,
  resetAfterCommit(rootNode) {
    if (typeof rootNode.onComputeLayout === 'function') {
      rootNode.onComputeLayout()
    }

    // Since renders are throttled at the instance level and <Static> component children
    // are rendered only once and then get deleted, we need an escape hatch to
    // trigger an immediate render to ensure <Static> children are written to output before they get erased
    if (rootNode.isStaticDirty) {
      rootNode.isStaticDirty = false
      if (typeof rootNode.onImmediateRender === 'function') {
        rootNode.onImmediateRender()
      }

      return
    }

    if (typeof rootNode.onRender === 'function') {
      rootNode.onRender()
    }
  },
  getChildHostContext(parentHostContext, type) {
    const isInsideText = type === 'kubb-text'
    const isFile = type === 'kubb-file' || parentHostContext.isFile

    const isSource = type === 'kubb-source' || parentHostContext.isSource

    return { isInsideText, isFile, isSource, type }
  },
  shouldSetTextContent: () => false,
  createInstance(originalType, newProps, _root) {
    const node = createNode(originalType)

    for (const [key, value] of Object.entries(newProps)) {
      if (key === 'children') {
        continue
      }

      setAttribute(node, key, value as DOMNodeAttribute)
    }

    return node
  },
  createTextInstance(text, _root, hostContext) {
    if (hostContext.isFile && !hostContext.isSource) {
      throw new Error('[react] `${text}` should be part of <File.Source> component when using the <File/> component.')
    }

    return createTextNode(text)
  },
  resetTextContent() {},
  hideTextInstance(node) {
    setTextNodeValue(node, '')
  },
  unhideTextInstance(node, text) {
    setTextNodeValue(node, text)
  },
  getPublicInstance: (instance) => instance,
  appendInitialChild: appendChildNode,
  appendChild: appendChildNode,
  insertBefore: insertBeforeNode,
  finalizeInitialChildren(_node, _type, _props, _rootNode) {
    return false
  },
  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  getCurrentEventPriority: () => DefaultEventPriority,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  detachDeletedInstance() {},
  getInstanceFromNode: () => null,
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,
  appendChildToContainer: appendChildNode,
  insertInContainerBefore: insertBeforeNode,
  removeChildFromContainer(node, removeNode) {
    removeChildNode(node, removeNode)
  },
  prepareUpdate(_node, _type, oldProps, newProps, _rootNode) {
    const props = diff(oldProps, newProps)

    if (!props) {
      return null
    }

    return { props }
  },
  commitUpdate(node, payload, type, oldProps, newProps) {
    const { props } = newProps

    if (props) {
      for (const [key, value] of Object.entries(props)) {
        setAttribute(node, key, value as DOMNodeAttribute)
      }
    }
  },
  commitTextUpdate(node, _oldText, newText) {
    setTextNodeValue(node, newText)
  },
  removeChild(node, removeNode) {
    removeChildNode(node, removeNode)
  },
  // new for react 19
  // @ts-ignore
  setCurrentUpdatePriority: (newPriority) => {
    currentUpdatePriority = newPriority
  },
  getCurrentUpdatePriority: () => currentUpdatePriority,
  resolveUpdatePriority: () => currentUpdatePriority || DefaultEventPriority,
  maySuspendCommit() {
    return false
  },
  startSuspendingCommit() {},
  waitForCommitToBeReady() {
    return null
  },
  preloadInstance() {
    // Return true to indicate it's already loaded
    return true
  },
  suspendInstance() {},
  shouldAttemptEagerTransition() {
    return false
  },
})

export type { FiberRoot } from 'react-reconciler'

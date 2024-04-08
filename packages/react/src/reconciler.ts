import createReconciler from 'react-reconciler'
import { DefaultEventPriority } from 'react-reconciler/constants.js'

import { appendChildNode, createNode, createTextNode, insertBeforeNode, removeChildNode, setAttribute, setTextNodeValue } from './shared/dom.ts'

import type { DOMElement, DOMNodeAttribute, ElementNames, TextNode } from './types.ts'

type AnyObject = Record<string, unknown>

const diff = (before: AnyObject, after: AnyObject): AnyObject | undefined => {
  if (before === after) {
    return
  }

  if (!before) {
    return after
  }

  const changed: AnyObject = {}
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
  isInsideText: boolean
}

type UpdatePayload = {
  props: Props | undefined
}

export const reconciler = createReconciler<
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
    isInsideText: false,
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
    const previousIsInsideText = parentHostContext.isInsideText
    const isInsideText = type === 'kubb-text'

    if (previousIsInsideText === isInsideText) {
      return parentHostContext
    }

    return { isInsideText }
  },
  shouldSetTextContent: () => false,
  createInstance(originalType, newProps, _root) {
    const node = createNode(originalType)

    for (const [key, value] of Object.entries(newProps)) {
      if (key === 'children') {
        continue
      }

      if (key === 'internal_transform') {
        node.internal_transform = value as any
        continue
      }

      if (key === 'internal_static') {
        node.internal_static = true
        continue
      }

      setAttribute(node, key, value as DOMNodeAttribute)
    }

    return node
  },
  createTextInstance(text, _root, hostContext) {
    if (!hostContext.isInsideText) {
      // TODO check if needed
      // throw new Error(`[react] Text string "${text}" must be rendered inside <Text> component`)
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
  finalizeInitialChildren(node, _type, _props, rootNode) {
    if (node.internal_static) {
      rootNode.isStaticDirty = true

      // Save reference to <Static> node to skip traversal of entire
      // node tree to find it
      rootNode.staticNode = node
    }

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
  prepareUpdate(node, _type, oldProps, newProps, rootNode) {
    if (node.internal_static) {
      rootNode.isStaticDirty = true
    }

    const props = diff(oldProps, newProps)

    const style = diff(oldProps['style'] as any, newProps['style'] as any)

    if (!props && !style) {
      return null
    }

    return { props, style }
  },
  commitUpdate(node, { props }) {
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (key === 'internal_transform') {
          node.internal_transform = value as any
          continue
        }

        if (key === 'internal_static') {
          node.internal_static = true
          continue
        }

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
})

export type { FiberRoot } from 'react-reconciler'

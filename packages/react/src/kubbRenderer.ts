import Reconciler from 'react-reconciler'
import { DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants'

import { appendChildNode, createNode, createTextNode, insertBeforeNode, removeChildNode, setAttribute, setTextNodeValue } from './dom.ts'
import type { KubbNode } from './types'
import type { DOMElement, DOMNodeAttribute, ElementNames, TextNode } from './types.ts'

declare module 'react-reconciler' {
  // @ts-expect-error custom override
  interface Reconciler {
    updateContainerSync(element: KubbNode, container: unknown, parentComponent: any, callback?: null | (() => void)): void
    flushSyncWork(): void
    createContainer(
      containerInfo: unknown,
      tag: Reconciler.RootTag,
      hydrationCallbacks: null | Reconciler.SuspenseHydrationCallbacks<any>,
      isStrictMode: boolean,
      concurrentUpdatesByDefaultOverride: null | boolean,
      identifierPrefix: string,
      onUncaughtError: (error: Error) => void,
      onCaughtError: (error: Error) => void,
      onRecoverableError: (error: Error) => void,
      transitionCallbacks: null | Reconciler.TransitionTracingCallbacks,
    ): Reconciler.OpaqueRoot
  }
}

type Props = Record<string, unknown>

type HostContext = {
  type: ElementNames
  isFile: boolean
  isSource: boolean
}

let currentUpdatePriority = NoEventPriority

/**
 * @link https://www.npmjs.com/package/react-devtools-inline
 * @link https://github.com/nitin42/Making-a-custom-React-renderer/blob/master/part-one.md
 * @link https://github.com/facebook/react/tree/main/packages/react-reconciler#practical-examples
 * @link https://github.com/vadimdemedes/ink
 * @link https://github.com/pixijs/pixi-react/tree/main/packages
 * @link https://github.com/diegomura/react-pdf/blob/master/packages/reconciler/src/reconciler-31.ts
 */
export const KubbRenderer = Reconciler({
  getRootHostContext: () => ({
    type: 'kubb-root',
    isFile: false,
    isSource: false,
  }),
  prepareForCommit: () => {
    return null
  },
  preparePortalMount: () => null,
  clearContainer: () => false,
  resetAfterCommit(rootNode: DOMElement) {
    if (typeof rootNode.onRender === 'function') {
      rootNode.onRender()
    }
  },
  getChildHostContext(parentHostContext: HostContext, type: ElementNames) {
    const isInsideText = type === 'kubb-text'
    const isFile = type === 'kubb-file' || parentHostContext.isFile
    const isSource = type === 'kubb-source' || parentHostContext.isSource

    return { isInsideText, isFile, isSource, type }
  },
  shouldSetTextContent: () => false,
  createInstance(originalType: ElementNames, newProps: Props, _root: DOMElement) {
    const node = createNode(originalType)

    for (const [key, value] of Object.entries(newProps)) {
      if (key === 'children') {
        continue
      }

      setAttribute(node, key, value as DOMNodeAttribute)
    }

    return node
  },
  createTextInstance(text: string, _root: DOMElement, hostContext: HostContext) {
    if (hostContext.isFile && !hostContext.isSource) {
      throw new Error(`[react] '${text}' should be part of <File.Source> component when using the <File/> component`)
    }

    return createTextNode(text)
  },
  resetTextContent() {},
  hideTextInstance(node: TextNode) {
    setTextNodeValue(node, '')
  },
  unhideTextInstance(node: TextNode, text: string) {
    setTextNodeValue(node, text)
  },
  getPublicInstance: (instance) => instance,
  appendInitialChild: appendChildNode,
  appendChild: appendChildNode,
  insertBefore: insertBeforeNode,
  finalizeInitialChildren(_node, _type, _props, _rootNode) {
    return false
  },
  supportsMutation: true,
  isPrimaryRenderer: true,
  supportsPersistence: false,
  supportsHydration: false,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  detachDeletedInstance() {},
  getInstanceFromNode: () => null,
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,
  appendChildToContainer: appendChildNode,
  insertInContainerBefore: insertBeforeNode,
  removeChildFromContainer(node: DOMElement, removeNode: TextNode) {
    removeChildNode(node, removeNode)
  },
  resetFormInstance() {},
  commitMount() {},
  commitUpdate(node: DOMElement, _payload, _type, _oldProps: Props, newProps: Props) {
    const { props } = newProps

    if (props) {
      for (const [key, value] of Object.entries(props)) {
        setAttribute(node, key, value as DOMNodeAttribute)
      }
    }
  },
  commitTextUpdate(node: TextNode, _oldText, newText) {
    setTextNodeValue(node, newText)
  },
  removeChild(node: DOMElement, removeNode: TextNode) {
    removeChildNode(node, removeNode)
  },
  setCurrentUpdatePriority: (newPriority: number) => {
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
  NotPendingTransition: undefined,
  requestPostPaintCallback: function (_callback: (time: number) => void): void {
    throw new Error('Function not implemented.')
  },
  trackSchedulerEvent: function (): void {
    throw new Error('Function not implemented.')
  },
  resolveEventType: function (): null | string {
    throw new Error('Function not implemented.')
  },
  resolveEventTimeStamp: function (): number {
    throw new Error('Function not implemented.')
  },
  HostTransitionContext: undefined as any,
})

export type { FiberRoot } from 'react-reconciler'

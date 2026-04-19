import { createContext } from "react";
import Reconciler, { type ReactContext } from "react-reconciler";
import {
  DefaultEventPriority,
  NoEventPriority,
} from "react-reconciler/constants.js";
import {
  appendChildNode,
  createNode,
  createTextNode,
  insertBeforeNode,
  removeChildNode,
  setAttribute,
  setTextNodeValue,
} from "./dom.ts";
import type { KubbReactNode } from "./types";
import type {
  DOMElement,
  DOMNodeAttribute,
  ElementNames,
  TextNode,
} from "./types.ts";

declare module "react-reconciler" {
  // @ts-expect-error custom override
  interface Reconciler {
    updateContainerSync(
      element: KubbReactNode,
      container: unknown,
      parentComponent: any,
      callback?: null | (() => void),
    ): void;
    flushSyncWork(): void;
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
    ): Reconciler.OpaqueRoot;
  }
}

type Props = Record<string, unknown>;

type HostContext = {
  type: ElementNames;
  isFile: boolean;
  isSource: boolean;
};

let currentUpdatePriority = NoEventPriority;

/**
 * @link https://www.npmjs.com/package/react-devtools-inline
 * @link https://github.com/nitin42/Making-a-custom-React-renderer/blob/master/part-one.md
 * @link https://github.com/facebook/react/tree/main/packages/react-reconciler#practical-examples
 * @link https://github.com/vadimdemedes/ink
 * @link https://github.com/pixijs/pixi-react/tree/main/packages
 * @link https://github.com/diegomura/react-pdf/blob/master/packages/reconciler/src/reconciler-31.ts
 */
export const Renderer = Reconciler({
  getRootHostContext: () => ({
    type: "kubb-root",
    isFile: false,
    isSource: false,
  }),
  prepareForCommit: () => {
    return null;
  },
  preparePortalMount: () => null,
  clearContainer: () => false,
  resetAfterCommit(rootNode: DOMElement) {
    if (typeof rootNode.onRender === "function") {
      rootNode.onRender();
    }
  },
  getChildHostContext(parentHostContext: HostContext, type: ElementNames) {
    const isInsideText = type === "kubb-text";
    const isFile = type === "kubb-file" || parentHostContext.isFile;
    const isSource = type === "kubb-source" || parentHostContext.isSource;

    return { isInsideText, isFile, isSource, type };
  },
  shouldSetTextContent: () => false,
  createInstance(
    originalType: ElementNames,
    newProps: Props,
    _root: DOMElement,
  ) {
    const node = createNode(originalType);

    for (const [key, value] of Object.entries(newProps)) {
      if (key === "children") {
        continue;
      }

      // Skip undefined values to match React's behavior
      if (value !== undefined) {
        setAttribute(node, key, value as DOMNodeAttribute);
      }
    }

    return node;
  },
  createTextInstance(
    text: string,
    _root: DOMElement,
    hostContext: HostContext,
  ) {
    if (hostContext.isFile && !hostContext.isSource) {
      throw new Error(
        `[react] '${text}' should be part of <File.Source> component when using the <File/> component`,
      );
    }

    return createTextNode(text);
  },
  resetTextContent() {},
  hideTextInstance(node: TextNode) {
    setTextNodeValue(node, "");
  },
  unhideTextInstance(node: TextNode, text: string) {
    setTextNodeValue(node, text);
  },
  getPublicInstance: (instance) => instance,
  appendInitialChild: appendChildNode,
  appendChild: appendChildNode,
  insertBefore: insertBeforeNode,
  finalizeInitialChildren(_node, _type, _props, _rootNode) {
    return false;
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
    removeChildNode(node, removeNode);
  },
  commitMount() {},
  commitUpdate(
    node: DOMElement,
    _payload,
    _type,
    _oldProps: Props,
    newProps: Props,
  ) {
    const { props } = newProps;

    if (props) {
      for (const [key, value] of Object.entries(props)) {
        // Skip undefined values to match React's behavior
        if (value !== undefined) {
          setAttribute(node, key, value as DOMNodeAttribute);
        }
      }
    }
  },
  commitTextUpdate(node: TextNode, _oldText, newText) {
    setTextNodeValue(node, newText);
  },
  removeChild(node: DOMElement, removeNode: TextNode) {
    removeChildNode(node, removeNode);
  },
  setCurrentUpdatePriority: (newPriority: number) => {
    currentUpdatePriority = newPriority;
  },
  getCurrentUpdatePriority: () => currentUpdatePriority,
  resolveUpdatePriority() {
    if (currentUpdatePriority !== NoEventPriority) {
      return currentUpdatePriority;
    }

    return DefaultEventPriority;
  },
  maySuspendCommit() {
    return false;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NotPendingTransition: undefined,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HostTransitionContext: createContext(
    null,
  ) as unknown as ReactContext<unknown>,
  resetFormInstance() {},
  requestPostPaintCallback() {},
  shouldAttemptEagerTransition() {
    return false;
  },
  trackSchedulerEvent() {},
  resolveEventType() {
    return null;
  },
  resolveEventTimeStamp() {
    return -1.1;
  },
  preloadInstance() {
    return true;
  },
  startSuspendingCommit() {},
  suspendInstance() {},
  waitForCommitToBeReady() {
    return null;
  },
});

export type { FiberRoot } from "react-reconciler";

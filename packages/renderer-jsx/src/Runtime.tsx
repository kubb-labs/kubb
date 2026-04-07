import { onProcessExit } from '@internals/utils'
import type { FileNode } from '@kubb/ast/types'
import { ConcurrentRoot } from 'react-reconciler/constants.js'
import { Root } from './components/Root.tsx'
import { createNode } from './dom.ts'
import type { FiberRoot } from './Renderer.ts'
import { Renderer } from './Renderer.ts'
import type { DOMElement, KubbReactElement } from './types.ts'
import { processFiles } from './utils.ts'

type Options = {
  /**
   * Set this to true to always see the result of the render in the console(line per render)
   */
  debug?: boolean
}

export class Runtime {
  readonly #options: Options
  #isUnmounted: boolean
  #renderError?: Error

  exitPromise?: Promise<void>

  nodes: FileNode[] = []
  readonly #container: FiberRoot
  readonly #rootNode: DOMElement

  constructor(options: Options) {
    this.#options = options
    this.#rootNode = createNode('kubb-root')
    this.#rootNode.onRender = this.onRender
    this.#rootNode.onImmediateRender = this.onRender
    this.#isUnmounted = false
    this.unmount.bind(this)

    // Intercept noisy React errors
    console.error = (data: string | Error) => {
      const message = typeof data === 'string' ? data : data?.message
      if (
        message?.match(/Encountered two children with the same key/gi) ||
        message?.match(/React will try to recreat/gi) ||
        message?.match(/Each child in a list should have a unique/gi) ||
        message?.match(/The above error occurred in the <KubbErrorBoundary/gi) ||
        message?.match(/A React Element from an older version of React was render/gi)
      ) {
        return
      }
      console.log(data)
    }

    const logRecoverableError = typeof reportError === 'function' ? reportError : console.error

    const rootTag = ConcurrentRoot
    this.#container = Renderer.createContainer(
      this.#rootNode,
      rootTag,
      null,
      false,
      false,
      'id',
      logRecoverableError,
      logRecoverableError,
      logRecoverableError,
      null,
    )

    // Unmount when process exits
    // Unmount when process exits
    this.unsubscribeExit = onProcessExit((code) => {
      this.unmount(code)
    })
  }

  #renderPromise: Promise<void> = Promise.resolve()
  resolveExitPromise: () => void = () => {}
  rejectExitPromise: (reason?: Error) => void = () => {}
  unsubscribeExit: () => void = () => {}

  onRender: () => Promise<void> = () => {
    const previous = this.#renderPromise

    const task = previous
      .catch(() => {})
      .then(async () => {
        if (this.#isUnmounted) {
          return
        }

        const files = await processFiles(this.#rootNode)

        this.nodes.push(...files)

        if (!this.#options?.debug) {
          return
        }
      })

    this.#renderPromise = task.catch((error) => {
      this.onError(error as Error)
    })

    return this.#renderPromise
  }

  onError(error: Error): void {
    // Store the error to be thrown after render completes
    this.#renderError = error
  }

  onExit(error?: Error): void {
    setTimeout(() => {
      this.unmount(error)
    }, 0)
  }

  async render(node: KubbReactElement): Promise<void> {
    const props = {
      onExit: this.onExit.bind(this),
      onError: this.onError.bind(this),
    }

    const element = <Root {...props}>{node}</Root>

    Renderer.updateContainerSync(element, this.#container, null, null)
    Renderer.flushSyncWork()
    await this.#renderPromise

    // Throw any errors that occurred during rendering
    if (this.#renderError) {
      const error = this.#renderError
      this.#renderError = undefined
      throw error
    }
  }

  unmount(error?: Error | number | null): void {
    if (this.#isUnmounted) {
      return
    }

    if (this.#options?.debug) {
      console.log('Unmount', error)
    }

    this.onRender()
    this.unsubscribeExit()

    this.#isUnmounted = true

    Renderer.updateContainerSync(null, this.#container, null, null)

    if (error instanceof Error) {
      this.rejectExitPromise(error)
      return
    }

    this.resolveExitPromise()
  }

  async waitUntilExit(): Promise<void> {
    if (!this.exitPromise) {
      this.exitPromise = new Promise((resolve, reject) => {
        this.resolveExitPromise = resolve
        this.rejectExitPromise = reject
      })
    }

    return this.exitPromise
  }
}

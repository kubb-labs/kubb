import process from 'node:process'
import type { KubbFile } from '@kubb/core/fs'
import type { Logger } from '@kubb/core/logger'
import type { ReactNode } from 'react'
import { ConcurrentRoot } from 'react-reconciler/constants'
import { onExit } from 'signal-exit'
import type { RootContextProps } from './components/Root.tsx'
import { Root } from './components/Root.tsx'
import { createNode } from './dom.ts'
import type { FiberRoot } from './kubbRenderer.ts'
import { KubbRenderer } from './kubbRenderer.ts'
import { type RendererResult, renderer } from './renderer.ts'
import type { DOMElement } from './types.ts'

export type ReactTemplateOptions = {
  stdout?: NodeJS.WriteStream
  stdin?: NodeJS.ReadStream
  stderr?: NodeJS.WriteStream
  logger?: Logger
  /**
   * Set this to true to always see the result of the render in the console(line per render)
   */
  debug?: boolean
}

type Context = Omit<RootContextProps, 'exit'>

export class ReactTemplate {
  readonly #options: ReactTemplateOptions
  // Ignore last render after unmounting a tree to prevent empty output before exit
  #isUnmounted: boolean
  #lastRendererResult: RendererResult

  #exitPromise?: Promise<RendererResult>
  readonly #container: FiberRoot
  readonly #rootNode: DOMElement

  constructor(options: ReactTemplateOptions) {
    this.#options = options

    this.#rootNode = createNode('kubb-root')
    this.#rootNode.onRender = this.onRender
    this.#rootNode.onImmediateRender = this.onRender

    // Ignore last render after unmounting a tree to prevent empty output before exit
    this.#isUnmounted = false
    this.unmount.bind(this)

    // Store last output to only rerender when needed
    this.#lastRendererResult = {
      exports: [],
      files: [],
      imports: [],
      output: '',
    }
    const originalError = console.error
    console.error = (data: string | Error) => {
      const message = typeof data === 'string' ? data : data?.message

      if (message.match(/Encountered two children with the same key/gi)) {
        return
      }
      if (message.match(/React will try to recreat/gi)) {
        return
      }
      if (message.match(/Each child in a list should have a unique/gi)) {
        return
      }
      if (message.match(/The above error occurred in the <KubbErrorBoundary/gi)) {
        return
      }

      if (message.match(/A React Element from an older version of React was render/gi)) {
        return
      }

      originalError(data)
    }

    // Report when an error was detected in a previous render
    // https://github.com/pmndrs/react-three-fiber/pull/2261
    const logRecoverableError =
      typeof reportError === 'function'
        ? // In modern browsers, reportError will dispatch an error event,
          // emulating an uncaught JavaScript error.
          reportError
        : // In older browsers and test environments, fallback to console.error.
          console.error

    const rootTag = ConcurrentRoot
    const hydrationCallbacks = null
    const isStrictMode = false
    const concurrentUpdatesByDefaultOverride = false
    const identifierPrefix = 'id'
    const onUncaughtError = logRecoverableError
    const onCaughtError = logRecoverableError
    const onRecoverableError = logRecoverableError
    const transitionCallbacks = null

    this.#container = KubbRenderer.createContainer(
      this.#rootNode,
      rootTag,
      hydrationCallbacks,
      isStrictMode,
      concurrentUpdatesByDefaultOverride,
      identifierPrefix,
      onUncaughtError,
      onCaughtError,
      onRecoverableError,
      transitionCallbacks,
    )

    // Unmount when process exits
    this.unsubscribeExit = onExit(
      (code) => {
        this.unmount(code)
      },
      { alwaysLast: false },
    ).bind(this)

    KubbRenderer.injectIntoDevTools({
      bundleType: 0, // 0 for PROD, 1 for DEV
      version: '18.3.1', // should be React version and not Kubb's custom version
      rendererPackageName: 'kubb', // package name
    })
  }

  get output(): string {
    return this.#lastRendererResult.output
  }

  get files(): Array<KubbFile.File> {
    return this.#lastRendererResult.files
  }

  async getFiles(): Promise<Array<KubbFile.File>> {
    return this.#lastRendererResult.files
  }

  resolveExitPromise: (result: RendererResult) => void = () => {}
  rejectExitPromise: (reason?: Error) => void = () => {}
  unsubscribeExit: () => void = () => {}

  onRender: () => void = () => {
    if (this.#isUnmounted) {
      return
    }

    const result = renderer(this.#rootNode)

    if (this.#options.debug) {
      console.log(result.output)
    }

    if (this.#options.stdout) {
      this.#options.stdout.clearLine(0)
      this.#options.stdout.cursorTo(0)
      this.#options.stdout.write(result.output)
    }

    this.#lastRendererResult = result
  }
  onError(error: Error): void {
    if (process.env.NODE_ENV === 'test') {
      console.warn(error)
    }

    throw error
  }
  onExit(error?: Error): void {
    this.unmount(error)
  }

  render(node: ReactNode, context?: Context): RendererResult {
    const element = (
      <Root logger={this.#options.logger} meta={context?.meta || {}} onExit={this.onExit.bind(this)} onError={this.onError.bind(this)}>
        {node}
      </Root>
    )

    KubbRenderer.updateContainerSync(element, this.#container, null, null)

    KubbRenderer.flushSyncWork()

    return renderer(this.#rootNode)
  }

  async renderToString(node: ReactNode, context?: Context): Promise<string> {
    await this.render(node, context)

    return this.#lastRendererResult.output
  }

  unmount(error?: Error | number | null): void {
    if (this.#isUnmounted) {
      return
    }

    if (this.#options.debug) {
      console.log('Unmount', error)
    }

    this.onRender()
    this.unsubscribeExit()

    this.#isUnmounted = true

    KubbRenderer.updateContainerSync(null, this.#container, null, null)

    if (this.#options.stdout) {
      this.#options.stdout.clearLine(0)
      this.#options.stdout.cursorTo(0)
      this.#options.stdout.write(`${this.#lastRendererResult.output}\n`)
    }

    if (error instanceof Error) {
      this.rejectExitPromise(error)

      return
    }

    this.resolveExitPromise(this.#lastRendererResult)
  }

  async waitUntilExit(): Promise<RendererResult> {
    this.#exitPromise ||= new Promise((resolve, reject) => {
      this.resolveExitPromise = resolve
      this.rejectExitPromise = reject
    })

    return this.#exitPromise
  }
}

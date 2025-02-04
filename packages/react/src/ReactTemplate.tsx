import process from 'node:process'
import { onExit } from 'signal-exit'

import { Root } from './components/Root.tsx'
import { KubbRenderer } from './kubbRenderer.ts'
import { type RendererResult, renderer } from './renderer.ts'
import { throttle } from './utils/throttle.ts'

import { FileManager, processFiles } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'
import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
import type { RootContextProps } from './components/Root.tsx'
import { createNode } from './dom.ts'
import type { FiberRoot } from './kubbRenderer.ts'
import type { DOMElement } from './types.ts'

// https://agent-hunt.medium.com/hello-world-custom-react-renderer-9a95b7cd04bc
const noop = () => {}

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
    this.#rootNode.onRender = options.debug ? this.onRender : throttle(this.onRender, 32)[0]
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
    //@ts-ignore
    console.error = (data: string | Error) => {
      if (typeof data === 'string') {
        if (data.match(/React will try to recreat/gi)) {
          return
        }
        if (data.match(/Each child in a list should have a unique/gi)) {
          return
        }
        if (data.match(/The above error occurred in the <KubbErrorBoundary/gi)) {
          return
        }
      }

      originalError(data)
    }

    this.#container = KubbRenderer.createContainer(
      this.#rootNode,
      // Legacy mode
      0,
      null,
      false,
      null,
      'id',
      () => {},
      null,
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

  render(node: ReactNode, context?: Context): void {
    const element = (
      <Root logger={this.#options.logger} meta={context?.meta || {}} onExit={this.onExit.bind(this)} onError={this.onError.bind(this)}>
        {node}
      </Root>
    )

    KubbRenderer.updateContainer(element, this.#container, null, noop)
  }
  renderToString(node: ReactNode, context?: Context): string {
    this.render(node, context)

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

    KubbRenderer.updateContainer(null, this.#container, null, noop)

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

  async write() {
    const fileManager = new FileManager()

    await fileManager.add(...this.#lastRendererResult.files)

    return processFiles({
      root: process.cwd(),
      files: fileManager.files,
    })
  }

  async waitUntilExit(): Promise<RendererResult> {
    this.#exitPromise ||= new Promise((resolve, reject) => {
      this.resolveExitPromise = resolve
      this.rejectExitPromise = reject
    })

    return this.#exitPromise
  }
}

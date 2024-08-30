import process from 'node:process'
import { onExit } from 'signal-exit'

import { Root } from './components/Root.tsx'
import { KubbRenderer } from './kubbRenderer.ts'
import { type RendererResult, renderer } from './renderer.ts'
import { throttle } from './utils/throttle.ts'

import type { Logger } from '@kubb/core/logger'
import type * as KubbFile from '@kubb/fs/types'
import autoBind from 'auto-bind'
import type { ReactNode } from 'react'
import * as React from 'react'
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
  debug?: boolean
}

export class ReactTemplate<Context extends RootContextProps = RootContextProps> {
  readonly #options: ReactTemplateOptions
  // Ignore last render after unmounting a tree to prevent empty output before exit
  #isUnmounted: boolean
  #lastRendererResult: RendererResult

  #exitPromise?: Promise<RendererResult>
  readonly #container: FiberRoot
  readonly #rootNode: DOMElement

  constructor(options: ReactTemplateOptions) {
    autoBind(this)
    this.#options = options

    this.#rootNode = createNode('kubb-root')
    this.#rootNode.onRender = options.debug ? this.onRender : throttle(this.onRender, 32)[0]
    this.#rootNode.onImmediateRender = this.onRender

    // Ignore last render after unmounting a tree to prevent empty output before exit
    this.#isUnmounted = false

    // Store last output to only rerender when needed
    this.#lastRendererResult = {
      exports: [],
      files: [],
      imports: [],
      output: '',
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
    )

    if (process.env['DEVTOOLS'] === 'true') {
      KubbRenderer.injectIntoDevTools({
        bundleType: 0, // 0 for PROD, 1 for DEV
        version: '18.3.1', // should be React version and not Kubb's custom version
        rendererPackageName: 'kubb', // package name
      })
    }
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
      console.log('Render', result.output)
    }

    this.#options.stdout?.write(result.output)

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
      <Root logger={this.#options.logger} meta={context?.meta || {}} onExit={this.onExit} onError={this.onError}>
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

    this.onRender()
    this.unsubscribeExit()

    this.#isUnmounted = true

    KubbRenderer.updateContainer(null, this.#container, null, noop)

    if (error instanceof Error) {
      if (this.#options.debug) {
        console.log('Unmount', error)
      }

      this.rejectExitPromise(error)
    } else {
      if (this.#options.debug) {
        console.log('Unmount', error)
      }
      this.resolveExitPromise(this.#lastRendererResult)
    }
  }

  async waitUntilExit(): Promise<RendererResult> {
    this.#exitPromise ||= new Promise((resolve, reject) => {
      this.resolveExitPromise = resolve
      this.rejectExitPromise = reject
    })

    return this.#exitPromise
  }
}

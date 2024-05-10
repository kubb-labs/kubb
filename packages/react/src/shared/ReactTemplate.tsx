import crypto from 'node:crypto'
import process from 'node:process'

import { Root } from '../components/Root.tsx'
import { reconciler } from '../reconciler.ts'
import { renderer } from './renderer.ts'
import { throttle } from './utils/throttle.ts'

import type { Logger } from '@kubb/core/logger'
import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
import type { RootContextProps } from '../components/Root.tsx'
import type { FiberRoot } from '../reconciler.ts'
import type { DOMElement } from '../types.ts'

// https://agent-hunt.medium.com/hello-world-custom-react-renderer-9a95b7cd04bc
const noop = () => {}

export type ReactTemplateOptions = {
  logger?: Logger
  debug?: boolean
}

export class ReactTemplate<Context extends RootContextProps = RootContextProps> {
  readonly #options: ReactTemplateOptions
  // Ignore last render after unmounting a tree to prevent empty output before exit
  #isUnmounted: boolean
  #lastOutput: string

  #lastFiles: KubbFile.File[] = []
  readonly #container: FiberRoot
  readonly #rootNode: DOMElement
  public logger?: Logger
  public readonly id = crypto.randomUUID()

  constructor(rootNode: DOMElement, options: ReactTemplateOptions = { debug: false }) {
    this.#options = options
    if (options.logger) {
      this.logger = options.logger
    }

    this.#rootNode = rootNode

    this.#rootNode.onRender = options.debug ? this.onRender : throttle(this.onRender, 32)[0]

    this.#rootNode.onImmediateRender = this.onRender

    // Ignore last render after unmounting a tree to prevent empty output before exit
    this.#isUnmounted = false

    // Store last output to only rerender when needed
    this.#lastOutput = ''

    this.#container = reconciler.createContainer(
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
    this.unsubscribeExit = this.unmount

    if (process.env['DEV'] === 'true') {
      reconciler.injectIntoDevTools({
        bundleType: 0,
        // Reporting React DOM's version, not Kubb's
        // See https://github.com/facebook/react/issues/16666#issuecomment-532639905
        version: '18.0.2',
        rendererPackageName: '@kubb/react',
      })
    }
  }

  get output(): string {
    return this.#lastOutput
  }

  get files(): KubbFile.File[] {
    return this.#lastFiles
  }

  resized = (): void => {
    this.onRender()
  }

  resolveExitPromise: () => void = () => {}
  rejectExitPromise: (reason?: Error) => void = () => {}
  unsubscribeExit: () => void = () => {}

  onRender: () => void = () => {
    if (this.#isUnmounted) {
      return
    }

    const { output, files } = renderer(this.#rootNode)

    this.#lastOutput = output
    this.#lastFiles = files
  }
  onError(error: Error): void {
    if (process.env.NODE_ENV === 'test') {
      console.error(error)
    }
    if (!this.logger) {
      console.error(error)
    }
  }

  render(node: ReactNode, context?: Context): void {
    if (context) {
      const element = (
        <Root logger={this.logger} meta={context.meta} onError={this.onError}>
          {node}
        </Root>
      )

      reconciler.updateContainer(element, this.#container, null, noop)
      return
    }

    reconciler.updateContainer(node, this.#container, null, noop)
  }

  unmount(error?: Error | number | null): void {
    if (this.#isUnmounted) {
      return
    }

    this.onRender()
    this.unsubscribeExit()

    this.#isUnmounted = true

    reconciler.updateContainer(null, this.#container, null, noop)

    if (error instanceof Error) {
      this.rejectExitPromise(error)
    } else {
      this.resolveExitPromise()
    }
  }
}

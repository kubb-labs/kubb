/* eslint-disable @typescript-eslint/unbound-method */
import crypto from 'node:crypto'
import process from 'node:process'

import { throttle } from '@kubb/core'

import { App } from '../components/App.tsx'
import { reconciler } from '../reconciler.ts'
import { renderer } from './renderer.ts'

import type { KubbFile, Logger } from '@kubb/core'
import type { ReactNode } from 'react'
import type { AppContextProps } from '../components/AppContext.tsx'
import type { FiberRoot } from '../reconciler.ts'
import type { DOMElement } from '../types.ts'

const noop = () => {}

export type ReactTemplateOptions = {
  logger?: Logger
  debug?: boolean
}

export class ReactTemplate<Context extends AppContextProps = AppContextProps> {
  readonly #options: ReactTemplateOptions
  // Ignore last render after unmounting a tree to prevent empty output before exit
  #isUnmounted: boolean
  #lastOutput: string
  #lastFile?: KubbFile.File
  readonly #container: FiberRoot
  readonly #rootNode: DOMElement
  public readonly id = crypto.randomUUID()

  constructor(rootNode: DOMElement, options: ReactTemplateOptions = { debug: false }) {
    // autoBind(this)

    this.#options = options
    this.#rootNode = rootNode

    this.#rootNode.onRender = options.debug ? this.onRender : throttle(this.onRender, 32)[0]

    this.#rootNode.onImmediateRender = this.onRender

    // Ignore last render after unmounting a tree to prevent empty output before exit
    this.#isUnmounted = false

    // Store last output to only rerender when needed
    this.#lastOutput = ''

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  get file(): KubbFile.File | undefined {
    return this.#lastFile
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

    const { output, file, imports, exports } = renderer(this.#rootNode)

    this.#lastOutput = output
    this.#lastFile = file
  }
  onError(_error: Error): void {}

  render(node: ReactNode, context?: Context): void {
    if (context) {
      const tree = (
        <App logger={this.#options.logger} meta={context.meta} onError={this.onError}>
          {node}
        </App>
      )

      reconciler.updateContainer(tree, this.#container, null, noop)
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

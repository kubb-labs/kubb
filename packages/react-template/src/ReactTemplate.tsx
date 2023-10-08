/* eslint-disable @typescript-eslint/unbound-method */
import process from 'node:process'
import React from 'react'
import type { ReactNode } from 'react'
import type { Export, Import} from '@kubb/core';
import { throttle } from '@kubb/core'
import autoBind from 'auto-bind'
import type { FiberRoot } from 'react-reconciler'
import { reconciler } from './reconciler.ts'
import { renderer } from './renderer.ts'
import * as dom from './dom.js'
import { instances } from './instances.ts'
import { App } from './components/App.tsx'

const noop = () => {}

export type ReactTemplateOptions = {
  stdout: NodeJS.WriteStream
  stdin: NodeJS.ReadStream
  stderr: NodeJS.WriteStream
  debug: boolean
  exitOnCtrlC: boolean
  waitUntilExit?: () => Promise<void>
}

export class ReactTemplate {
  private readonly options: ReactTemplateOptions
  // Ignore last render after unmounting a tree to prevent empty output before exit
  private isUnmounted: boolean
  private lastOutput: string
  private lastImports: Import[] = []
  private lastExports: Export[] = []
  private readonly container: FiberRoot
  private readonly rootNode: dom.DOMElement
  // This variable is used only in debug mode to store full static output
  // so that it's rerendered every time, not just new static parts, like in non-debug mode
  private fullStaticOutput: string
  private exitPromise?: Promise<void>
  private restoreConsole?: () => void
  private readonly unsubscribeResize?: () => void

  constructor(options: ReactTemplateOptions) {
    autoBind(this)

    this.options = options
    this.rootNode = dom.createNode('kubb-root')

    this.rootNode.onRender = options.debug ? this.onRender : throttle(this.onRender, 32)[0]

    this.rootNode.onImmediateRender = this.onRender

    // Ignore last render after unmounting a tree to prevent empty output before exit
    this.isUnmounted = false

    // Store last output to only rerender when needed
    this.lastOutput = ''

    // This variable is used only in debug mode to store full static output
    // so that it's rerendered every time, not just new static parts, like in non-debug mode
    this.fullStaticOutput = ''

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.container = reconciler.createContainer(
      this.rootNode,
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
        // Reporting React DOM's version, not Ink's
        // See https://github.com/facebook/react/issues/16666#issuecomment-532639905
        version: '16.13.1',
        rendererPackageName: 'ink',
      })
    }
  }

  get output(): string {
    return this.lastOutput
  }
  get imports(): Import[] {
    return this.lastImports
  }
  get exports(): Export[] {
    return this.lastExports
  }

  resized = () => {
    this.onRender()
  }

  resolveExitPromise: () => void = () => {}
  rejectExitPromise: (reason?: Error) => void = () => {}
  unsubscribeExit: () => void = () => {}

  onRender: () => void = () => {
    if (this.isUnmounted) {
      return
    }

    const { output, imports, exports } = renderer(this.rootNode)

    if (this.options.debug) {
      this.options.stdout.write(this.fullStaticOutput + output)
      return
    }

    this.lastOutput = output
    this.lastImports = imports
    this.lastExports = exports
  }

  render(node: ReactNode): void {
    const tree = <App>{node}</App>

    reconciler.updateContainer(tree, this.container, null, noop)
  }

  writeToStdout(data: string): void {
    if (this.isUnmounted) {
      return
    }

    if (this.options.debug) {
      this.options.stdout.write(data + this.fullStaticOutput + this.lastOutput)
      return
    }

    this.options.stdout.write(data)
  }

  writeToStderr(data: string): void {
    if (this.isUnmounted) {
      return
    }

    if (this.options.debug) {
      this.options.stderr.write(data)
      this.options.stdout.write(this.fullStaticOutput + this.lastOutput)
      return
    }

    this.options.stderr.write(data)
  }

  unmount(error?: Error | number | null): void {
    if (this.isUnmounted) {
      return
    }

    this.onRender()
    this.unsubscribeExit()

    if (typeof this.restoreConsole === 'function') {
      this.restoreConsole()
    }

    if (typeof this.unsubscribeResize === 'function') {
      this.unsubscribeResize()
    }

    this.isUnmounted = true

    reconciler.updateContainer(null, this.container, null, noop)
    instances.delete(this.options.stdout)

    if (error instanceof Error) {
      this.rejectExitPromise(error)
    } else {
      this.resolveExitPromise()
    }
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

  clear(): void {}
}

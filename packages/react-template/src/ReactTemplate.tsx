/* eslint-disable @typescript-eslint/unbound-method */
import React from 'react'
import process from 'node:process'

import { throttle } from '@kubb/core'

import autoBind from 'auto-bind'

import { App } from './components/App.tsx'
import * as dom from './dom.ts'
import { instances } from './instances.ts'
import { reconciler } from './reconciler.ts'
import { renderer } from './renderer.ts'

import type { Export, Import } from '@kubb/core'
import type { ReactNode } from 'react'
import type { FiberRoot } from 'react-reconciler'

const noop = () => {}

export type ReactTemplateOptions = {
  id: string
  debug: boolean
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
        // Reporting React DOM's version, not Kubb's
        // See https://github.com/facebook/react/issues/16666#issuecomment-532639905
        version: '16.13.1',
        rendererPackageName: '@kubb/react-template',
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

  resized = (): void => {
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

    this.lastOutput = output
    this.lastImports = imports
    this.lastExports = exports
  }

  render(node: ReactNode): void {
    const tree = <App>{node}</App>

    reconciler.updateContainer(tree, this.container, null, noop)
  }

  unmount(error?: Error | number | null): void {
    if (this.isUnmounted) {
      return
    }

    this.onRender()
    this.unsubscribeExit()

    this.isUnmounted = true

    reconciler.updateContainer(null, this.container, null, noop)
    instances.delete(this.options.id)

    if (error instanceof Error) {
      this.rejectExitPromise(error)
    } else {
      this.resolveExitPromise()
    }
  }

  clear(): void {}
}

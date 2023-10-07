/* eslint-disable @typescript-eslint/unbound-method */
import process from 'node:process'
import type { ReactNode } from 'react'
import type { ReactTemplateOptions } from './ReactTemplate.ts'
import { ReactTemplate } from './ReactTemplate.tsx'
import { instances } from './instances.ts'
import { Import } from '@kubb/core'

export type RenderOptions = {
  /**
   * If true, each update will be rendered as a separate output, without replacing the previous one.
   *
   * @default false
   */
  debug?: boolean
}

export type Instance = {
  /**
   * Replace previous root node with a new one or update props of the current root node.
   */
  rerender: ReactTemplate['render']
  /**
   * Manually unmount the whole Ink app.
   */
  unmount: ReactTemplate['unmount']
  /**
   * Returns a promise, which resolves when app is unmounted.
   */
  waitUntilExit: ReactTemplate['waitUntilExit']
  cleanup: () => void

  /**
   * Clear output.
   */
  clear: () => void
  output: string
  imports: Import[]
}

/**
 * Mount a component and render the output.
 */
export function render(node: ReactNode | JSX.Element, options: RenderOptions = {}): Instance {
  const reactTemplateOptions: ReactTemplateOptions = {
    stdout: process.stdout,
    stdin: process.stdin,
    stderr: process.stderr,
    debug: false,
    exitOnCtrlC: true,
    ...options,
  }

  const instance = new ReactTemplate(reactTemplateOptions)
  instances.set(reactTemplateOptions.stdout, instance)

  instance.render(node)

  return {
    rerender: instance.render,
    output: instance.output,
    imports: instance.imports,
    unmount() {
      instance.unmount()
    },
    waitUntilExit: instance.waitUntilExit,
    cleanup: () => instances.delete(reactTemplateOptions.stdout),
    clear: instance.clear,
  }
}

const getInstance = (stdout: NodeJS.WriteStream, createInstance: () => ReactTemplate): ReactTemplate => {
  let instance = instances.get(stdout)

  if (!instance) {
    instance = createInstance()
    instances.set(stdout, instance)
  }

  return instance
}

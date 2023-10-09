/* eslint-disable @typescript-eslint/unbound-method */
import crypto from 'node:crypto'

import { instances } from './instances.ts'
import { ReactTemplate } from './ReactTemplate.tsx'

import type { Export, Import } from '@kubb/core'
import type { ReactNode } from 'react'
import type { AppContextProps } from './components/AppContext'
import type { ReactTemplateOptions } from './ReactTemplate.ts'

export type RenderOptions<Context extends AppContextProps = AppContextProps> = {
  /**
   * If true, each update will be rendered as a separate output, without replacing the previous one.
   *
   * @default false
   */
  debug?: boolean
  context?: Context
}

export type Instance = {
  /**
   * Replace previous root node with a new one or update props of the current root node.
   */
  rerender: ReactTemplate['render']
  /**
   * Manually unmount the whole Kubb app.
   */
  unmount: ReactTemplate['unmount']
  cleanup: () => void

  /**
   * Clear output.
   */
  clear: () => void
  output: string
  imports: Import[]
  exports: Export[]
}

/**
 * Mount a component and render the output.
 */
export function render<Context extends AppContextProps = AppContextProps>(node: ReactNode | JSX.Element, options: RenderOptions<Context> = {}): Instance {
  const reactTemplateOptions: ReactTemplateOptions = {
    debug: false,
    id: crypto.randomUUID(),
    context: { meta: {} },
    ...options,
  }

  const instance = new ReactTemplate(reactTemplateOptions)
  instances.set(reactTemplateOptions.id, instance)

  instance.render(node)

  return {
    rerender: instance.render,
    output: instance.output,
    imports: instance.imports,
    exports: instance.exports,
    unmount() {
      instance.unmount()
    },
    cleanup: () => instances.delete(reactTemplateOptions.id),
    clear: instance.clear,
  }
}

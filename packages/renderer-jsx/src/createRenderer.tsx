import type { FileNode } from '@kubb/ast/types'
import { Runtime } from './Runtime.tsx'
import type { KubbReactElement } from './types.ts'

type Options = {
  /**
   * Set this to true to always see the result of the render in the console(line per render)
   */
  debug?: boolean
}

export type Renderer = {
  render(Element: KubbReactElement): Promise<void>
  unmount(error?: Error | number | null): void
  files: Array<FileNode>
}

export function createRenderer(options: Options = {}): Renderer {
  const runtime = new Runtime(options)

  return {
    async render(Element) {
      await runtime.render(Element)
    },
    get files() {
      return runtime.nodes
    },
    unmount(error) {
      runtime.unmount(error)
    },
  }
}

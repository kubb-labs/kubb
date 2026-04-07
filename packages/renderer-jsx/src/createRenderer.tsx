import type { FileNode } from '@kubb/ast/types'
import { Runtime } from './Runtime.tsx'
import type { KubbReactElement } from './types.ts'

type Options = {
  /**
   * Print each render result to the console for debugging.
   * Useful when diagnosing output differences between renders.
   * @default false
   */
  debug?: boolean
}

/**
 * The renderer instance returned by {@link createRenderer}.
 *
 * Use `render` to process a JSX element tree and `files` to retrieve
 * the generated {@link FileNode} entries after rendering completes.
 */
export type Renderer = {
  /**
   * Render a JSX element tree and collect the resulting {@link FileNode} entries.
   * Resolves once all synchronous render work (including React's flush) is done.
   */
  render(Element: KubbReactElement): Promise<void>
  /**
   * Tear down the renderer and release all React resources.
   * Pass an `Error` to signal an abnormal shutdown.
   */
  unmount(error?: Error | number | null): void
  /**
   * The {@link FileNode} entries collected from the most recent `render` call.
   */
  files: Array<FileNode>
}

/**
 * Create a Kubb JSX renderer.
 *
 * The renderer converts a React JSX element tree — built from the components in this
 * package — into an array of {@link FileNode} entries representing the generated files.
 *
 * @example Basic usage
 * ```ts
 * import { createRenderer, File } from '@kubb/renderer-jsx'
 *
 * const renderer = createRenderer()
 * await renderer.render(
 *   <File baseName="pet.ts" path="src/models/pet.ts">
 *     <File.Source name="Pet" isExportable isIndexable>
 *       {`export type Pet = { id: number; name: string }`}
 *     </File.Source>
 *   </File>
 * )
 * console.log(renderer.files) // [FileNode]
 * renderer.unmount()
 * ```
 */
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

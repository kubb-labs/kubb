import type { FileNode } from '@kubb/ast/types'
import type { RendererFactory } from './createRenderer.ts'
import type { PluginDriver } from './PluginDriver.ts'

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - Renderer output → rendered via the provided `rendererFactory` (e.g. JSX), files stored in `driver.fileManager`
 * - `Array<FileNode>` → upserted directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 *
 * Pass a `rendererFactory` (e.g. `jsxRenderer` from `@kubb/renderer-jsx`) when the result
 * may be a renderer element. Generators that only return `Array<FileNode>` do not need one.
 */
export async function applyHookResult(result: unknown | Array<FileNode> | void, driver: PluginDriver, rendererFactory?: RendererFactory): Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  if (!rendererFactory) {
    // Fallback: attempt to use @kubb/renderer-jsx if available (backwards compatibility).
    // Generators that return renderer elements should declare `renderer` explicitly.
    try {
      const { createRenderer } = await import('@kubb/renderer-jsx')
      const renderer = createRenderer()
      // @ts-ignore – result is a renderer element; shape verified at runtime
      await renderer.render(result)
      driver.fileManager.upsert(...renderer.files)
      renderer.unmount()
    } catch {
      // renderer-jsx not available and no rendererFactory provided — skip silently
    }
    return
  }

  const renderer = rendererFactory()
  // @ts-ignore – result is a renderer element produced by the matching factory
  await renderer.render(result)
  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

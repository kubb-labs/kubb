import type { FileNode } from '@kubb/ast/types'
import { createRenderer } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginDriver } from './PluginDriver.ts'

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - React element → rendered via renderer-jsx, files stored in `driver.fileManager`
 * - `Array<FileNode>` → upserted directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 */
export async function applyHookResult(result: KubbReactNode | Array<FileNode> | void, driver: PluginDriver): Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  const renderer = createRenderer()

  // biome-ignore lint/complexity/noUselessFragments: not needed
  await renderer.render(<>{result as KubbReactNode}</>)

  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

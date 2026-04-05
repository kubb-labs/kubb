import type { FileNode } from '@kubb/ast/types'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginDriver } from './PluginDriver.ts'

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - React element → rendered via an isolated react-fabric context, files stored in `driver.fileManager`
 * - `Array<FileNode>` → upserted directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 */
export async function applyHookResult(result: FabricReactNode | Array<FileNode> | void, driver: PluginDriver): Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  // Non-array truthy result is treated as a React element (FabricReactNode)
  const fabricChild = createReactFabric()
  await fabricChild.render(<Fabric>{result as FabricReactNode}</Fabric>)
  driver.fileManager.upsert(...(fabricChild.files as unknown as Array<FileNode>))
  fabricChild.unmount()
}

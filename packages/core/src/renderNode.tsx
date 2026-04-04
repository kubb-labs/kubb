import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { FabricReactNode, Fabric as FabricType } from '@kubb/react-fabric/types'
import type { FileNode } from '@kubb/ast/types'

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - React element → rendered via an isolated react-fabric context, files merged into `fabric`
 * - `Array<FileNode>` → upserted directly into `fabric`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 */
export async function applyHookResult(result: FabricReactNode | Array<FileNode> | void, fabric: FabricType): Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    await fabric.upsertFile(...(result as Array<FileNode>))
    return
  }

  // Non-array truthy result is treated as a React element (FabricReactNode)
  const fabricChild = createReactFabric()
  await fabricChild.render(<Fabric>{result as FabricReactNode}</Fabric>)
  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

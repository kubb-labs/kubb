import type { FileNode } from '@kubb/ast/types'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { createRenderer } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
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

  // // Non-array truthy result is treated as a React element (FabricReactNode)
  // const fabricChild = createReactFabric()
  // await fabricChild.render(<Fabric>{result as FabricReactNode}</Fabric>)
  // driver.fileManager.upsert(...(fabricChild.files as unknown as Array<FileNode>))
  // fabricChild.unmount()

  const renderer = createRenderer()

  // biome-ignore lint/complexity/noUselessFragments: not needed
  await renderer.render(<>{result as KubbReactNode}</>)

  console.log(JSON.stringify(renderer.files, null, 2))
  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

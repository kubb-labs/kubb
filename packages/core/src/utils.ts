import { version as nodeVersion } from 'node:process'
import { version as KubbVersion } from '../package.json'

import type { FileNode } from '@kubb/ast'
import type { RendererFactory } from './createRenderer.ts'
import type { PluginDriver } from './PluginDriver.ts'
import type { Config, InputPath, UserConfig } from './types'

/**
 * Returns a snapshot of the current runtime environment.
 *
 * Useful for attaching context to debug logs and error reports so that
 * issues can be reproduced without manual information gathering.
 */
export function getDiagnosticInfo() {
  return {
    nodeVersion,
    KubbVersion,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
  } as const
}

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> & { input: InputPath }
export function isInputPath(config: Config | undefined): config is Config<InputPath> & { input: InputPath }
export function isInputPath(config: Config | UserConfig | undefined): config is (Config<InputPath> | UserConfig<InputPath>) & { input: InputPath } {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - Renderer output → rendered via the provided `rendererFactory` (e.g. JSX), files stored in `driver.fileManager`
 * - `Array<FileNode>` → added directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 *
 * Pass a `rendererFactory` (e.g. `jsxRenderer` from `@kubb/renderer-jsx`) when the result
 * may be a renderer element. Generators that only return `Array<FileNode>` do not need one.
 */
export async function applyHookResult<TElement = unknown>(
  result: TElement | Array<FileNode> | void,
  driver: PluginDriver,
  rendererFactory?: RendererFactory<TElement>,
): Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  if (!rendererFactory) {
    return
  }

  const renderer = rendererFactory()
  await renderer.render(result)
  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

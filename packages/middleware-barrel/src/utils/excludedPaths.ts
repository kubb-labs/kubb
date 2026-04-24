import { resolve } from 'node:path'
import type { Config, NormalizedPlugin } from '@kubb/core'

/**
 * Returns the absolute output directory of `plugin` with a trailing separator,
 * suitable for prefix-based exclusion checks via {@link isExcludedPath}.
 *
 * The trailing `/` ensures `startsWith` does not match unrelated siblings
 * (e.g. `/foo/bar` vs `/foo/barbaz/x.ts`).
 */
export function getPluginOutputPrefix(plugin: NormalizedPlugin, config: Config): string {
  return `${resolve(config.root, config.output.path, plugin.options.output.path)}/`
}

/**
 * Returns `true` when `filePath` lies under any of the directory prefixes in `prefixes`.
 * Prefixes must already include a trailing separator (see {@link getPluginOutputPrefix}).
 *
 * Uses Node 22 iterator helpers (`Iterator.prototype.some`) to avoid materializing the set.
 */
export function isExcludedPath(filePath: string, prefixes: ReadonlySet<string>): boolean {
  return prefixes.values().some((prefix) => filePath.startsWith(prefix))
}

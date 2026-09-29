import type { FileNode } from '@kubb/ast'
import type { NormalizedPlugin } from './types.ts'

/**
 * Adds the plugin's `output.imports` to each file that plugin owns (`meta.pluginName` matches).
 * Files from other plugins, such as barrels, are left alone. `FileManager` later merges and prunes
 * the imports, so a name the file never uses does not reach the output.
 *
 * @internal
 */
export function withOutputImports(plugin: NormalizedPlugin | undefined, files: Array<FileNode>): Array<FileNode> {
  const imports = plugin?.options.output?.imports
  if (!plugin || !imports?.length) return files

  return files.map((file) =>
    (file.meta as { pluginName?: string } | undefined)?.pluginName === plugin.name ? { ...file, imports: [...imports, ...file.imports] } : file,
  )
}

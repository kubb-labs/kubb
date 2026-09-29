import type { FileNode } from '@kubb/ast'
import type { NormalizedPlugin } from './types.ts'

/** Adds the plugin's `output.imports` to the files it owns (`meta.pluginName` matches). @internal */
export function withOutputImports(plugin: NormalizedPlugin | undefined, files: Array<FileNode>): Array<FileNode> {
  const imports = plugin?.options.output?.imports
  if (!plugin || !imports?.length) return files

  return files.map((file) =>
    (file.meta as { pluginName?: string } | undefined)?.pluginName === plugin.name ? { ...file, imports: [...imports, ...file.imports] } : file,
  )
}

import type { FileNode } from '@kubb/ast'
import type { NormalizedPlugin } from './types.ts'

function isOwnedBy(file: FileNode, pluginName: string): boolean {
  const { meta } = file
  return typeof meta === 'object' && meta !== null && 'pluginName' in meta && meta.pluginName === pluginName
}

/** Adds the plugin's `output.imports` to the files it owns (`meta.pluginName` matches). @internal */
export function withOutputImports(plugin: NormalizedPlugin | undefined, files: Array<FileNode>): Array<FileNode> {
  const imports = plugin?.options.output?.imports
  if (!plugin || !imports?.length) return files

  return files.map((file) => (isOwnedBy(file, plugin.name) ? { ...file, imports: [...imports, ...file.imports] } : file))
}

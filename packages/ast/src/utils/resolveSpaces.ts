import path from 'node:path'
import { memo } from '@internals/utils'
import { createExport, createFile, createImport } from '../nodes/file.ts'
import type { ExportNode, FileNode, ImportNode, ModuleName, Space } from '../nodes/file.ts'
import { getNames, getSpace } from './moduleNames.ts'

type ResolveSpacesResult = {
  file: FileNode
  /**
   * Names whose declaration was not found, such as `QueryClient from @tanstack/react-query`. They print as values.
   */
  unresolved: Array<string>
}

// A name declared as both a type and a value, such as an `asConst` enum, is a value: a value import of it is always valid.
const spacesCache = memo.create<FileNode, Map<string, Space>>({ weak: true })

function declaredSpaces(file: FileNode): Map<string, Space> {
  return memo(spacesCache, file, () => {
    const spaces = new Map<string, Space>()
    for (const source of file.sources) {
      const space = getSpace(source)
      for (const name of [source.name, source.default ? 'default' : undefined]) {
        if (name && spaces.get(name) !== 'value') spaces.set(name, space)
      }
    }
    return spaces
  })
}

const isOpen = (node: ImportNode | ExportNode): boolean => !!node.names && getNames(node).some((item) => !item.space)

/**
 * Fills in each missing `space` from the source with that name in the file `getFile` returns for the import or
 * export path. Returns the same file when no space is missing.
 *
 * @example
 * ```ts
 * const { file: resolved, unresolved } = resolveSpaces(file, (path) => files.get(path))
 * ```
 */
export function resolveSpaces(file: FileNode, getFile: (path: string) => FileNode | undefined): ResolveSpacesResult {
  if (!file.imports.some(isOpen) && !file.exports.some(isOpen)) return { file, unresolved: [] }

  const unresolved: Array<string> = []
  const settle = (node: ImportNode | ExportNode, target: FileNode | undefined): Array<ModuleName> =>
    getNames(node).map((item) => {
      if (item.space) return item
      const space = item.name === '*' ? 'value' : target && declaredSpaces(target).get(item.name)
      if (!space) unresolved.push(`${item.name} from ${node.path}`)
      return { ...item, space: space || 'value' }
    })

  // A relative path is written without the extension of the file it points to, and a folder stands for its index file.
  const target = (node: ImportNode | ExportNode): FileNode | undefined => {
    const from = node.kind === 'Import' && node.root ? node.root : file.path
    const base = path.resolve(path.dirname(from), node.path)
    return getFile(node.path) ?? getFile(base) ?? getFile(`${base}${file.extname}`) ?? getFile(path.join(base, `index${file.extname}`))
  }

  const imports = file.imports.map((node) => (isOpen(node) ? createImport({ path: node.path, root: node.root, names: settle(node, target(node)) }) : node))
  const exports = file.exports.map((node) => (isOpen(node) ? createExport({ path: node.path, names: settle(node, target(node)) }) : node))

  return { file: createFile({ ...file, imports, exports }), unresolved }
}

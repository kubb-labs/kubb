import { memo } from '@internals/utils'
import { ast, type FileNode } from '@kubb/ast'

/** An import with a `plugin` that could not be given a path. */
export type SymbolProblem = {
  /** `notFound` when the plugin emitted the name in no file, `ambiguous` when in several. */
  kind: 'notFound' | 'ambiguous'
  file: string
  /** Plugin that emitted the importing file, when one did. */
  importer?: string
  plugin: string
  name: string
  /** Files the plugin emitted the name in. */
  paths: Array<string>
}

/**
 * Gives every import that names a `plugin` the path of the file where that plugin emitted the name as an exportable,
 * named source, one import per file with the names in their written order. Returns the changed files, and a problem for each name found in no file or in
 * several, whose import is dropped.
 */
export function resolveSymbols(files: ReadonlyArray<FileNode>): { files: Array<FileNode>; problems: Array<SymbolProblem> } {
  const importing = files.filter((file) => file.imports.some((imp) => imp.plugin))
  if (importing.length === 0) return { files: [], problems: [] }

  // `plugin\0name` → paths. A set, so a value and a type with one name in one file count once.
  const declared = new Map<string, Set<string>>()
  for (const file of files) {
    for (const { plugin, name, isExportable } of file.sources) {
      if (plugin && name && isExportable) memo(declared, `${plugin}\0${name}`, () => new Set<string>()).add(file.path)
    }
  }

  const problems: Array<SymbolProblem> = []
  const resolved = importing.map((file) => {
    const imports = file.imports.flatMap((imp) => {
      const { plugin } = imp
      // `createImport` gives a plugin import named imports only.
      if (!plugin || !Array.isArray(imp.name)) return [imp]
      // Names grouped per file in their written order, so each file gets one import that reads as the caller wrote it.
      const byPath = new Map<string, typeof imp.name>()
      for (const item of imp.name) {
        const name = typeof item === 'string' ? item : item.propertyName
        const paths = [...(declared.get(`${plugin}\0${name}`) ?? [])]
        if (paths.length === 1) {
          memo(byPath, paths[0]!, () => []).push(item)
          continue
        }
        const importer = file.sources.find((source) => source.plugin)?.plugin || undefined
        problems.push({ kind: paths.length ? 'ambiguous' : 'notFound', file: file.path, importer, plugin, name, paths })
      }
      return [...byPath].map(([path, name]) => ({ ...imp, name, path, root: file.path, plugin: null }))
    })
    // `createFile` merges the per-name imports per path again and drops imports of the file itself.
    return ast.factory.createFile({ ...file, imports })
  })

  return { files: resolved, problems }
}

import { ast, type FileNode, type ImportNode } from '@kubb/ast'

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

type ImportItem = Extract<ImportNode['name'], Array<unknown>>[number]

/**
 * Gives every import that names a `plugin` the path of the file where that plugin emitted the name as an exportable,
 * named source, one import per file. Returns the changed files, and a problem for each name found in no file or in
 * several, whose import is dropped.
 */
export function resolveSymbols(files: ReadonlyArray<FileNode>): { files: Array<FileNode>; problems: Array<SymbolProblem> } {
  const importing = files.filter((file) => file.imports.some((imp) => imp.plugin))
  if (importing.length === 0) return { files: [], problems: [] }

  // plugin → name → paths. A set, so a value and a type with one name in one file count once.
  const table = new Map<string, Map<string, Set<string>>>()
  for (const file of files) {
    for (const source of file.sources) {
      if (!source.plugin || !source.name || !source.isExportable) continue
      let names = table.get(source.plugin)
      if (!names) table.set(source.plugin, (names = new Map()))
      let paths = names.get(source.name)
      if (!paths) names.set(source.name, (paths = new Set()))
      paths.add(file.path)
    }
  }

  const problems: Array<SymbolProblem> = []
  const resolve = (file: FileNode, imp: ImportNode & { plugin: string }, item: ImportItem): Array<ImportNode> => {
    const name = typeof item === 'string' ? item : item.propertyName
    const paths = [...(table.get(imp.plugin)?.get(name) ?? [])]
    if (paths.length !== 1) {
      const importer = file.sources.find((source) => source.plugin)?.plugin || undefined
      problems.push({ kind: paths.length ? 'ambiguous' : 'notFound', file: file.path, importer, plugin: imp.plugin, name, paths })
      return []
    }
    return [{ ...imp, name: [item], path: paths[0]!, root: file.path, plugin: null }]
  }

  const resolved = importing.map((file) => {
    const imports = file.imports.flatMap((imp) => {
      // `createImport` only lets a plugin import have named imports.
      if (!imp.plugin || !Array.isArray(imp.name)) return [imp]
      return imp.name.flatMap((item) => resolve(file, imp as ImportNode & { plugin: string }, item))
    })
    // `createFile` merges the per-name imports per path again and drops imports of the file itself.
    return ast.factory.createFile({ ...file, imports })
  })

  return { files: resolved, problems }
}

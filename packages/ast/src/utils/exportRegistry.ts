import { createFile } from '../nodes/file.ts'
import type { FileNode, ImportNode } from '../nodes/file.ts'

/**
 * Maps every exported symbol name to the path of the file that defines it. Built once from the
 * full set of generated files and used to resolve {@link ImportNode.resolveFromExports} imports.
 */
export type ExportRegistry = Map<string, string>

type ImportItem = string | { propertyName: string; name?: string }

function importItemName(item: ImportItem): string {
  return typeof item === 'string' ? item : (item.name ?? item.propertyName)
}

/**
 * Builds a registry of `exported name → defining file path` from every file's exportable sources.
 * Re-exports (barrel files) are ignored so imports resolve to where a symbol is defined, not to a
 * barrel. The first file to export a name wins, so later duplicates do not clobber it.
 */
export function buildExportRegistry(files: ReadonlyArray<FileNode>): ExportRegistry {
  const registry: ExportRegistry = new Map()
  for (const file of files) {
    for (const source of file.sources) {
      if (source.isExportable && source.name && !registry.has(source.name)) {
        registry.set(source.name, file.path)
      }
    }
  }
  return registry
}

/**
 * Whether a file has at least one import whose path must be resolved from the export registry.
 */
export function hasDeferredImports(file: FileNode): boolean {
  return file.imports.some((imp) => imp.resolveFromExports)
}

/**
 * Rewrites a file's {@link ImportNode.resolveFromExports} imports to concrete imports pointing at
 * the files that define each name (grouped per file), then re-normalizes via `createFile` so the
 * result is merged, deduped, and stripped of self-imports. Names missing from the registry are
 * dropped. Returns the file unchanged when it has no deferred imports.
 */
export function resolveDeferredImports(file: FileNode, registry: ExportRegistry): FileNode {
  if (!hasDeferredImports(file)) {
    return file
  }

  const imports: Array<ImportNode> = []
  for (const imp of file.imports) {
    if (!imp.resolveFromExports) {
      imports.push(imp)
      continue
    }

    const { resolveFromExports: _resolveFromExports, ...rest } = imp
    const root = rest.root ?? file.path
    const names = Array.isArray(imp.name) ? imp.name : [imp.name]
    const byPath = new Map<string, Array<ImportItem>>()
    for (const item of names) {
      const targetPath = registry.get(importItemName(item))
      if (!targetPath) continue
      const grouped = byPath.get(targetPath) ?? []
      grouped.push(item)
      byPath.set(targetPath, grouped)
    }
    for (const [targetPath, grouped] of byPath) {
      imports.push({ ...rest, name: grouped, path: targetPath, root })
    }
  }

  return createFile({ ...file, imports })
}

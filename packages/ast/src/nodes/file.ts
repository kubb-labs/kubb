import { hash } from 'node:crypto'
import path from 'node:path'
import { combineExports, combineImports, combineSources, importLocalName } from '../utils/combineFileMembers.ts'
import { extractStringsFromNodes } from '../utils/extractStringsFromNodes.ts'
import { type BaseNode, nodeFactory } from './base.ts'
import type { CodeNode } from './code.ts'

type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

type ImportName = string | Array<string | { propertyName: string; name?: string }>

/**
 * A language-agnostic import declaration.
 *
 * @example Named, default, type-only, and namespace imports
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * createImport({ name: 'React', path: 'react' })
 * createImport({ name: ['FC'], path: 'react', isTypeOnly: true })
 * createImport({ name: 'React', path: 'react', isNameSpace: true })
 * ```
 */
export type ImportNode = BaseNode & {
  kind: 'Import'
  /** Named imports as an array, a default import as a string. */
  name: ImportName
  path: string
  /** `import type { Type } from './path'`. */
  isTypeOnly?: boolean | null
  /** `import * as Name from './path'`. */
  isNameSpace?: boolean | null
  /** When set, the import path is resolved relative to this root. */
  root?: string | null
}

/**
 * A language-agnostic export declaration.
 *
 * @example Named, type-only, wildcard, and namespace-alias exports
 * ```ts
 * createExport({ name: ['Pets'], path: './Pets' })
 * createExport({ name: ['Pet'], path: './Pet', isTypeOnly: true })
 * createExport({ path: './utils' })
 * createExport({ name: 'utils', path: './utils', asAlias: true })
 * ```
 */
export type ExportNode = BaseNode & {
  kind: 'Export'
  /** Export name(s). When omitted, generates a wildcard export. */
  name?: string | Array<string> | null
  path: string
  /** `export type { Type } from './path'`. */
  isTypeOnly?: boolean | null
  /** `export * as aliasName from './path'`. */
  asAlias?: boolean | null
}

/** A fragment of source code within a file. */
export type SourceNode = BaseNode & {
  kind: 'Source'
  /** Used for deduplication and barrel generation. */
  name?: string | null
  isTypeOnly?: boolean | null
  /** Include the `export` keyword in the generated source. */
  isExportable?: boolean | null
  /** Include this source in barrel/index file generation. */
  isIndexable?: boolean | null
  /** Child nodes in DOM order. Use a {@link TextNode} for raw string content. */
  nodes?: Array<CodeNode>
}

/**
 * A fully resolved file. Created via `createFile()`, which computes `id`, `name`, and `extname`
 * from the input and deduplicates `imports`, `exports`, and `sources`.
 */
export type FileNode<TMeta extends object = object> = BaseNode & {
  kind: 'File'
  /** SHA256 hash of the file path, computed by `createFile`. */
  id: string
  /** File name without extension, derived from `baseName`. */
  name: string
  /** File base name including extension, shaped like `${name}${extname}`. */
  baseName: `${string}.${string}`
  /** Full qualified path to the file. */
  path: string
  /** Extension extracted from `baseName`. */
  extname: Extname
  sources: Array<SourceNode>
  imports: Array<ImportNode>
  exports: Array<ExportNode>
  /** Read by plugins during barrel generation. */
  meta?: TMeta
  /** Prepended to the generated file. Accepts `null` so `resolver.default.banner()` results can be passed directly. */
  banner?: string | null
  /** Appended to the generated file. Accepts `null` so `resolver.default.footer()` results can be passed directly. */
  footer?: string | null
  /**
   * Absolute on-disk path to copy into the output, through the parser's `copy` hook when it has one.
   *
   * Use to emit a real source file shipped inside a package (a template) into the generated
   * folder. When set, `copy` provides the file content and any `sources` nodes are ignored for
   * output; `sources` may still carry `name`/`isExportable`/`isIndexable` so barrel generation
   * treats the file the same as a rendered one.
   */
  copy?: string | null
}

export const createImport = nodeFactory<ImportNode>('Import')
export const createExport = nodeFactory<ExportNode>('Export')
export const createSource = nodeFactory<SourceNode>('Source')

/** Input descriptor for {@link createFile}, before `id`, `name`, and `extname` are computed. */
export type UserFileNode<TMeta extends object = object> = Omit<FileNode<TMeta>, 'kind' | 'id' | 'name' | 'extname' | 'imports' | 'exports' | 'sources'> &
  Pick<Partial<FileNode<TMeta>>, 'imports' | 'exports' | 'sources'>

/**
 * Creates a fully resolved `FileNode`: computes `id` (SHA256 of the path), `name`, and `extname`
 * from `baseName`, and deduplicates `sources`, `exports`, and `imports` (dropping unused imports).
 *
 * @throws {Error} when `baseName` has no extension.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')] })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 * })
 * // file.name = 'petStore', file.extname = '.ts'
 * ```
 */
export function createFile<TMeta extends object = object>(input: UserFileNode<TMeta>): FileNode<TMeta> {
  const extname = path.extname(input.baseName) as `.${string}`
  if (!extname) {
    throw new Error(`No extname found for ${input.baseName}`)
  }

  const resolvedExports = input.exports?.length ? combineExports(input.exports) : []

  // Skip building the source text and local-name set when there are no imports to resolve against them.
  const resolvedImports: Array<ImportNode> = (() => {
    if (!input.imports?.length) return []

    const sourceParts: Array<string> = []
    const localNames = new Set<string>()
    for (const item of input.sources ?? []) {
      const extracted = item.nodes && extractStringsFromNodes(item.nodes)
      if (extracted) sourceParts.push(extracted)
      if (item.name) localNames.add(item.name)
    }
    const source = sourceParts.join('\n') || undefined
    const combinedImports = combineImports(input.imports, resolvedExports, source)
    // Consolidating output (`mode: 'file'`) can put a symbol's definition and an import of it in the
    // same file: by path when the import still targets this file, by name when consolidation moved it.
    return combinedImports.flatMap((imp) => {
      if (imp.path === input.path) return []
      if (!Array.isArray(imp.name)) {
        return typeof imp.name === 'string' && localNames.has(imp.name) ? [] : [imp]
      }
      const kept = imp.name.filter((item) => !localNames.has(importLocalName(item)))

      if (!kept.length) return []
      return [kept.length === imp.name.length ? imp : { ...imp, name: kept }]
    })
  })()
  const resolvedSources = input.sources?.length ? combineSources(input.sources) : []

  return {
    ...input,
    kind: 'File',
    id: hash('sha256', input.path, 'hex'),
    name: path.basename(input.baseName, extname),
    extname,
    imports: resolvedImports,
    exports: resolvedExports,
    sources: resolvedSources,
    meta: (input.meta ?? {}) as TMeta,
  }
}

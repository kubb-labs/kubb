import { extname, posix } from 'node:path'
import { ast, Diagnostics } from '@kubb/kit'
import { toPosixPath } from '@internals/utils'
import type { BarrelType } from './types.ts'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const BARREL_SUFFIX = `/index.ts`

/**
 * A file (no `children`) or directory in the tree barrels are computed from. `path` is absolute and
 * POSIX-normalized, and a directory's `children` are keyed by entry name in sorted order.
 */
type TreeNode = { path: string; children?: undefined } | DirectoryNode
type DirectoryNode = { path: string; children: Map<string, TreeNode> }

function compareSegments(a: ReadonlyArray<string>, b: ReadonlyArray<string>): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1
  }
  return a.length - b.length
}

function toRelativeModulePath(fromDir: string, filePath: string): string {
  return `./${posix.relative(fromDir, filePath)}`
}

type WalkContext = {
  sourceFiles: ReadonlyMap<string, ast.FileNode>
  reportedCollisions: Set<string>
  recursive: boolean
  leafExports: (dirPath: string, leafPath: string) => Array<ast.ExportNode>
}

function makeBarrel(dirPath: string, exports: Array<ast.ExportNode>, { sourceFiles, reportedCollisions }: WalkContext): ast.FileNode {
  const owners = new Map<string, string>()
  const uniqueExports: Array<ast.ExportNode> = []

  for (const item of exports) {
    const itemPath = posix.join(dirPath, item.path)
    // A wildcard export carries no names, so collisions are checked against its source file.
    const names = item.name == null ? (sourceFiles.get(itemPath)?.sources.flatMap((source) => source.name || []) ?? []) : [item.name].flat()
    const uniqueNames = names.filter((name) => {
      const first = owners.get(name)
      if (!first) {
        owners.set(name, item.path)
        return true
      }

      const key = [name, posix.join(dirPath, first), itemPath].join('\0')
      if (!reportedCollisions.has(key)) {
        reportedCollisions.add(key)
        Diagnostics.report({
          code: Diagnostics.code.barrelDuplicateExport,
          severity: 'error',
          message: `"${name}" is exported by both "${first}" and "${item.path}", so "${dirPath}${BARREL_SUFFIX}" cannot re-export both.`,
          help: 'Rename one of the colliding declarations, or configure the plugin resolver to produce distinct names.',
        })
      }
      return false
    })

    if (item.name == null) {
      uniqueExports.push(item)
    } else if (uniqueNames.length > 0) {
      uniqueExports.push(ast.factory.createExport({ ...item, name: Array.isArray(item.name) ? uniqueNames : uniqueNames[0] }))
    }
  }

  return ast.factory.createFile({ baseName: 'index.ts', path: `${dirPath}${BARREL_SUFFIX}`, exports: uniqueExports })
}

type LeafStrategy = (path: string, sourceFile: ast.FileNode | undefined) => Array<ast.ExportNode>

function indexableNames(sources: ReadonlyArray<ast.SourceNode>, isTypeOnly: boolean): Array<string> {
  const names = sources.flatMap((source) => (source.isIndexable && source.name && Boolean(source.isTypeOnly) === isTypeOnly ? [source.name] : []))
  return [...new Set(names)].sort()
}

const allStrategy: LeafStrategy = (path, sourceFile) => {
  const sources = sourceFile?.sources ?? []
  return sources.length > 0 && !sources.some((source) => source.isIndexable) ? [] : [ast.factory.createExport({ path })]
}

const namedStrategy: LeafStrategy = (path, sourceFile) => {
  if (!sourceFile?.sources.length) return [ast.factory.createExport({ path })]

  const valueNames = indexableNames(sourceFile.sources, false)
  const typeNames = indexableNames(sourceFile.sources, true)
  return [
    ...(valueNames.length > 0 ? [ast.factory.createExport({ name: valueNames, path })] : []),
    ...(typeNames.length > 0 ? [ast.factory.createExport({ name: typeNames, path, isTypeOnly: true })] : []),
  ]
}

/**
 * Post-order walk that yields a barrel re-exporting every leaf below the visited directory, for
 * the start node and, with `recursive`, every sub-directory. Returns the subtree's leaf paths.
 */
function* walkFlat(node: DirectoryNode, ctx: WalkContext, isRoot = true): Generator<ast.FileNode, Array<string>> {
  const leaves: Array<string> = []

  for (const child of node.children.values()) {
    if (!child.children) {
      leaves.push(child.path)
      continue
    }
    for (const leaf of yield* walkFlat(child, ctx, false)) leaves.push(leaf)
  }

  const exports = isRoot || ctx.recursive ? leaves.flatMap((leaf) => ctx.leafExports(node.path, leaf)) : []
  if (exports.length > 0) yield makeBarrel(node.path, exports, ctx)

  return leaves
}

/**
 * Recursive walk that yields one barrel per directory, re-exporting files and sub-barrels.
 * Used when nested: true. Leaf files honor the barrel `strategy`, so `named` emits explicit
 * named exports instead of wildcards. Sub-directory barrels are chained with a wildcard
 * re-export, which forwards the names the child barrel already curated. Returns whether this
 * node yielded a barrel, so a parent never re-exports a sub-directory that produced nothing.
 */
function* walkNested(node: DirectoryNode, ctx: WalkContext): Generator<ast.FileNode, boolean> {
  const exports: Array<ast.ExportNode> = []

  for (const child of node.children.values()) {
    if (!child.children) {
      exports.push(...ctx.leafExports(node.path, child.path))
    } else if (yield* walkNested(child, ctx)) {
      exports.push(ast.factory.createExport({ path: toRelativeModulePath(node.path, `${child.path}${BARREL_SUFFIX}`) }))
    }
  }

  if (exports.length === 0) return false

  yield makeBarrel(node.path, exports, ctx)
  return true
}

/**
 * A directory tree plus the source-file lookup it was built from, scoped to a single output root.
 * Build it once with {@link buildBarrelIndex} and derive every barrel (per-plugin and root) from
 * it via {@link getBarrelFiles}, instead of re-scanning the full file set once per barrel.
 */
type BarrelIndex = {
  tree: DirectoryNode
  sourceFiles: ReadonlyMap<string, ast.FileNode>
}

/**
 * Indexes `files` once for the directory rooted at `outputPath`: filters to indexable source
 * files under that path and builds their directory tree. Reuse the result across every barrel
 * derived from the same root rather than re-filtering and re-building per barrel.
 */
export function buildBarrelIndex(outputPath: string, files: ReadonlyArray<ast.FileNode>): BarrelIndex {
  const tree: DirectoryNode = { path: toPosixPath(outputPath), children: new Map() }
  const sourceFiles = new Map<string, ast.FileNode>()

  for (const file of files) {
    const filePath = toPosixPath(file.path)
    if (filePath.startsWith(`${tree.path}/`) && !filePath.endsWith(BARREL_SUFFIX) && SOURCE_EXTENSIONS.has(extname(filePath))) {
      sourceFiles.set(filePath, file)
    }
  }

  // Inserting paths in per-segment order keeps every directory's children sorted by name.
  const entries = [...sourceFiles.keys()]
    .map((filePath) =>
      filePath
        .slice(tree.path.length + 1)
        .split('/')
        .filter(Boolean),
    )
    .sort(compareSegments)
  for (const parts of entries) {
    let dir = tree
    for (const [i, part] of parts.entries()) {
      const path = `${dir.path}/${part}`
      const child = dir.children.get(part) ?? (i === parts.length - 1 ? { path } : { path, children: new Map() })
      dir.children.set(part, child)
      if (child.children) dir = child
    }
  }

  return { tree, sourceFiles }
}

/**
 * Locates the directory node for `targetPath` within an index tree. Returns `undefined` when no
 * file exists under `targetPath` (nothing to barrel).
 */
function findDirectory(tree: DirectoryNode, targetPath: string): DirectoryNode | undefined {
  if (targetPath === tree.path) return tree
  if (!targetPath.startsWith(`${tree.path}/`)) return undefined

  let node: TreeNode | undefined = tree
  for (const part of targetPath.slice(tree.path.length + 1).split('/')) {
    node = node?.children?.get(part)
  }
  return node?.children ? node : undefined
}

type GetBarrelFilesParams = {
  /**
   * Index built once via {@link buildBarrelIndex} for the shared output root.
   */
  index: BarrelIndex
  /**
   * Absolute directory the barrel(s) should be rooted at, a subtree of the index root.
   * Defaults to the index root.
   */
  targetPath?: string
  /**
   * Export strategy used when emitting each barrel.
   * - `'all'` re-exports the whole module (`export * from './x'`)
   * - `'named'` re-exports only the indexable named symbols
   */
  barrelType: BarrelType
  /**
   * Generate an `index.ts` in every sub-directory, each re-exporting only what's directly inside it (hierarchical).
   * When false, uses flat generation strategy with optional recursive subdirectory barrels.
   */
  nested?: boolean
  /**
   * Also generate a barrel for each sub-directory when nested is false.
   * No effect when nested is true (always generates hierarchical structure).
   */
  recursive?: boolean
  /**
   * Collision identities reported by related barrel generations in the same build.
   */
  reportedCollisions?: Set<string>
}

/**
 * Yields barrel `ast.FileNode`s for `targetPath` (or the index root), derived from a shared index.
 * Locating the subtree is a bounded walk down from the root, so deriving many barrels (one per
 * plugin, plus the root) from one index avoids re-scanning the full file set for each.
 *
 * @example
 * ```ts
 * const index = buildBarrelIndex(outputPath, files)
 * for (const file of getBarrelFiles({ index, targetPath, barrelType })) {
 *   upsertFile(file)
 * }
 * ```
 */
export function* getBarrelFiles({
  index,
  targetPath,
  barrelType,
  nested = false,
  recursive = false,
  reportedCollisions = new Set(),
}: GetBarrelFilesParams): Generator<ast.FileNode> {
  const node = targetPath ? findDirectory(index.tree, toPosixPath(targetPath)) : index.tree
  if (!node) return

  const strategy = barrelType === 'named' ? namedStrategy : allStrategy
  const ctx: WalkContext = {
    sourceFiles: index.sourceFiles,
    reportedCollisions,
    recursive,
    leafExports: (dirPath, leafPath) => strategy(toRelativeModulePath(dirPath, leafPath), index.sourceFiles.get(leafPath)),
  }

  yield* nested ? walkNested(node, ctx) : walkFlat(node, ctx)
}

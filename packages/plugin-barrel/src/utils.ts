import { extname, posix } from 'node:path'
import { ast, Diagnostics } from '@kubb/kit'
import { toPosixPath } from '@internals/utils'
import type { BarrelType } from './types.ts'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const BARREL_SUFFIX = `/index.ts`

/**
 * A node in the directory tree used to compute barrel file exports.
 * Either represents a directory (with `children`) or a file (`isFile: true`, empty `children`).
 */
type BuildTree = {
  /**
   * Absolute filesystem path of this directory or file. Always normalized to POSIX (`/`) separators.
   */
  path: string
  /**
   * Sub-directories and files contained within this directory.
   * Always empty for file nodes.
   */
  children: Array<BuildTree>
  /**
   * `true` when this node represents a file (leaf), `false` for directory nodes.
   */
  isFile: boolean
}

/**
 * Builds a directory tree rooted at `rootPath` from a list of absolute file paths.
 * Paths outside `rootPath` are silently ignored. Children are sorted alphabetically
 * by path so consumers (barrel exports, propagated indexes) emit a deterministic order.
 *
 * Both POSIX (`/`) and Windows (`\`) separators are accepted in input paths; emitted node
 * paths are always POSIX-normalized so downstream prefix/lookup operations behave the same
 * across platforms.
 *
 * @example
 * ```ts
 * buildTree('/src/gen/types', [
 *   '/src/gen/types/pet.ts',
 *   '/src/gen/types/pets/listPets.ts',
 * ])
 * ```
 */
function buildTree(rootPath: string, filePaths: ReadonlyArray<string>): BuildTree {
  const normalizedRoot = toPosixPath(rootPath)
  const root: BuildTree = { path: normalizedRoot, children: [], isFile: false }
  // Per-directory child lookup avoids the O(N) `Array.find` scan during insertion.
  // WeakMap keyed by object identity so directory nodes are GC-eligible once the tree is discarded.
  const childIndex = new WeakMap<BuildTree, Map<string, BuildTree>>()
  childIndex.set(root, new Map())

  const rootPrefix = `${normalizedRoot}/`

  for (const filePath of filePaths) {
    const normalized = toPosixPath(filePath)
    if (!normalized.startsWith(rootPrefix)) continue

    const parts = normalized.slice(rootPrefix.length).split('/')
    let current = root
    const lastIndex = parts.length - 1
    for (const [i, part] of parts.entries()) {
      if (!part) continue

      const isLast = i === lastIndex
      const siblings = childIndex.get(current)!
      let child = siblings.get(part)
      if (!child) {
        child = { path: `${current.path}/${part}`, children: [], isFile: isLast }
        current.children.push(child)
        siblings.set(part, child)
        if (!isLast) childIndex.set(child, new Map())
      }
      current = child
    }
  }

  sortTree(root)

  return root
}

function sortTree(node: BuildTree): void {
  if (node.children.length === 0) return
  node.children.sort(compareByPath)

  for (const child of node.children) {
    if (!child.isFile) sortTree(child)
  }
}

function compareByPath(a: BuildTree, b: BuildTree): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

function toRelativeModulePath({ fromDir, filePath }: { fromDir: string; filePath: string }): string {
  return `./${posix.relative(fromDir, filePath)}`
}

function isBarrelPath(path: string): boolean {
  return path.endsWith(BARREL_SUFFIX)
}

type MakeBarrelParams = {
  dirPath: string
  exports: Array<ast.ExportNode>
  sourceFiles: ReadonlyMap<string, ast.FileNode>
  reportedCollisions: Set<string>
}

function makeBarrel({ dirPath, exports, sourceFiles, reportedCollisions }: MakeBarrelParams): ast.FileNode {
  const names = new Map<string, string>()
  const uniqueExports: Array<ast.ExportNode> = []

  for (const item of exports) {
    const itemPath = posix.join(dirPath, item.path)
    const itemNames = Array.isArray(item.name)
      ? item.name
      : item.name
        ? [item.name]
        : sourceFiles.get(itemPath)?.sources.flatMap((source) => (source.name ? [source.name] : []))
    const uniqueNames: Array<string> = []

    for (const name of itemNames ?? []) {
      const first = names.get(name)
      if (!first) {
        names.set(name, item.path)
        uniqueNames.push(name)
        continue
      }

      const key = [name, posix.join(dirPath, first), itemPath].join('\0')
      if (reportedCollisions.has(key)) continue
      reportedCollisions.add(key)
      Diagnostics.report({
        code: Diagnostics.code.barrelDuplicateExport,
        severity: 'error',
        message: `"${name}" is exported by both "${first}" and "${item.path}", so "${dirPath}${BARREL_SUFFIX}" cannot re-export both.`,
        help: 'Rename one of the colliding declarations, or configure the plugin resolver to produce distinct names.',
      })
    }

    if (!itemNames || item.name == null || uniqueNames.length > 0) {
      uniqueExports.push(item.name == null ? item : ast.factory.createExport({ ...item, name: Array.isArray(item.name) ? uniqueNames : uniqueNames[0] }))
    }
  }

  return ast.factory.createFile({ baseName: 'index.ts', path: `${dirPath}${BARREL_SUFFIX}`, exports: uniqueExports })
}

type LeafStrategy = (params: { dirPath: string; leafPath: string; sourceFile: ast.FileNode | undefined }) => Array<ast.ExportNode>

function indexableNames({ sources, isTypeOnly }: { sources: ReadonlyArray<ast.SourceNode>; isTypeOnly: boolean }): Array<string> {
  const names = sources.flatMap((source) => (source.isIndexable && source.name && Boolean(source.isTypeOnly) === isTypeOnly ? [source.name] : []))
  return [...new Set(names)].sort()
}

const allStrategy: LeafStrategy = ({ dirPath, leafPath, sourceFile }) => {
  const sources = sourceFile?.sources ?? []
  if (sources.length > 0 && !sources.some((source) => source.isIndexable)) return []
  return [ast.factory.createExport({ path: toRelativeModulePath({ fromDir: dirPath, filePath: leafPath }) })]
}

const namedStrategy: LeafStrategy = ({ dirPath, leafPath, sourceFile }) => {
  const modulePath = toRelativeModulePath({ fromDir: dirPath, filePath: leafPath })

  if (!sourceFile) return [ast.factory.createExport({ path: modulePath })]

  const valueNames = indexableNames({ sources: sourceFile.sources, isTypeOnly: false })
  const typeNames = indexableNames({ sources: sourceFile.sources, isTypeOnly: true })

  if (valueNames.length === 0 && typeNames.length === 0) {
    if (sourceFile.sources.length > 0) return []
    return [ast.factory.createExport({ path: modulePath })]
  }

  const exports: Array<ast.ExportNode> = []
  if (valueNames.length > 0) {
    exports.push(ast.factory.createExport({ name: valueNames, path: modulePath }))
  }
  if (typeNames.length > 0) {
    exports.push(ast.factory.createExport({ name: typeNames, path: modulePath, isTypeOnly: true }))
  }
  return exports
}

type WalkParams = {
  sourceFiles: ReadonlyMap<string, ast.FileNode>
  strategy: LeafStrategy
  reportedCollisions: Set<string>
}

/**
 * Post-order walk that yields a barrel per visited directory.
 * Returns the list of leaf file paths collected in this subtree (used by the parent call).
 */
function* walkAllOrNamed(
  node: BuildTree,
  params: WalkParams,
  { isRoot, recursive }: { isRoot: boolean; recursive: boolean },
): Generator<ast.FileNode, Array<string>> {
  const subtreeLeaves: Array<string> = []

  for (const child of node.children) {
    if (child.isFile) {
      if (!isBarrelPath(child.path)) subtreeLeaves.push(child.path)
      continue
    }

    const childLeaves = yield* walkAllOrNamed(child, params, { isRoot: false, recursive })
    for (const leaf of childLeaves) subtreeLeaves.push(leaf)
  }

  if (!isRoot && !recursive) return subtreeLeaves

  const exports = subtreeLeaves.flatMap((leafPath) => params.strategy({ dirPath: node.path, leafPath, sourceFile: params.sourceFiles.get(leafPath) }))

  if (exports.length > 0) {
    yield makeBarrel({ dirPath: node.path, exports, sourceFiles: params.sourceFiles, reportedCollisions: params.reportedCollisions })
  }

  return subtreeLeaves
}

/**
 * Recursive walk that yields one barrel per directory, re-exporting files and sub-barrels.
 * Used when nested: true. Leaf files honor the barrel `strategy`, so `named` emits explicit
 * named exports instead of wildcards. Sub-directory barrels are chained with a wildcard
 * re-export, which forwards the names the child barrel already curated. Returns whether this
 * node yielded a barrel, so a parent never re-exports a sub-directory that produced nothing.
 */
function* walkNested(node: BuildTree, params: WalkParams): Generator<ast.FileNode, boolean> {
  const exports: Array<ast.ExportNode> = []

  for (const child of node.children) {
    if (child.isFile) {
      if (isBarrelPath(child.path)) continue
      exports.push(...params.strategy({ dirPath: node.path, leafPath: child.path, sourceFile: params.sourceFiles.get(child.path) }))
      continue
    }

    const childYieldedBarrel = yield* walkNested(child, params)
    if (childYieldedBarrel) {
      exports.push(ast.factory.createExport({ path: toRelativeModulePath({ fromDir: node.path, filePath: `${child.path}${BARREL_SUFFIX}` }) }))
    }
  }

  if (exports.length > 0) {
    yield makeBarrel({ dirPath: node.path, exports, sourceFiles: params.sourceFiles, reportedCollisions: params.reportedCollisions })
    return true
  }

  return false
}

/**
 * A directory tree plus the source-file lookup it was built from, scoped to a single output root.
 * Build it once with {@link buildBarrelIndex} and derive every barrel (per-plugin and root) from
 * it via {@link getBarrelFiles}, instead of re-scanning the full file set once per barrel.
 */
type BarrelIndex = {
  tree: BuildTree
  sourceFiles: ReadonlyMap<string, ast.FileNode>
}

/**
 * Indexes `files` once for the directory rooted at `outputPath`: filters to indexable source
 * files under that path and builds their directory tree. Reuse the result across every barrel
 * derived from the same root rather than re-filtering and re-building per barrel.
 */
export function buildBarrelIndex(outputPath: string, files: ReadonlyArray<ast.FileNode>): BarrelIndex {
  const outputPrefix = `${toPosixPath(outputPath)}/`
  const sourceFiles = new Map<string, ast.FileNode>()

  for (const file of files) {
    const normalized = toPosixPath(file.path)
    if (!normalized.startsWith(outputPrefix)) continue
    if (isBarrelPath(normalized)) continue
    if (!SOURCE_EXTENSIONS.has(extname(normalized))) continue

    sourceFiles.set(normalized, file)
  }

  return { tree: buildTree(outputPath, [...sourceFiles.keys()]), sourceFiles }
}

/**
 * Locates the node for `targetPath` within an index tree, walking down through directory nodes
 * only. Returns `undefined` when no file exists at or under `targetPath` (nothing to barrel).
 */
function findNode(node: BuildTree, targetPath: string): BuildTree | undefined {
  if (node.path === targetPath) return node
  if (node.isFile || !targetPath.startsWith(`${node.path}/`)) return undefined

  for (const child of node.children) {
    if (!child.isFile && (child.path === targetPath || targetPath.startsWith(`${child.path}/`))) {
      return findNode(child, targetPath)
    }
  }

  return undefined
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
  const node = targetPath ? findNode(index.tree, toPosixPath(targetPath)) : index.tree
  if (!node) return

  const strategy = barrelType === 'named' ? namedStrategy : allStrategy

  if (nested) {
    yield* walkNested(node, { sourceFiles: index.sourceFiles, strategy, reportedCollisions })
    return
  }

  yield* walkAllOrNamed(node, { sourceFiles: index.sourceFiles, strategy, reportedCollisions }, { isRoot: true, recursive })
}

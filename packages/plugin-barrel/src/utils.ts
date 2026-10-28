import { extname, posix } from 'node:path'
import { ast, Diagnostics } from '@kubb/kit'
import { pascalCase, toPosixPath } from '@internals/utils'
import type { BarrelType } from './types.ts'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const BARREL_SUFFIX = `/index.ts`

/**
 * A file (no `children`) or directory in the tree barrels are computed from. `path` is absolute and
 * POSIX-normalized, and a directory's `children` are keyed by entry name.
 */
type TreeNode = { path: string; children?: undefined } | DirectoryNode
type DirectoryNode = { path: string; children: Map<string, TreeNode> }

/** A directory's children in name order, the way a directory listing sorts them. */
function sortedChildren(node: DirectoryNode): Array<TreeNode> {
  return [...node.children.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, child]) => child)
}

function toRelativeModulePath(fromDir: string, filePath: string): string {
  return `./${posix.relative(fromDir, filePath)}`
}

type WalkContext = {
  sourceFiles: ReadonlyMap<string, ast.FileNode>
  barrelFiles: Map<string, ast.FileNode>
  reportedCollisions: Set<string>
  recursive: boolean
  namespace: boolean
  additionalExports: ReadonlyArray<ast.ExportNode>
  leafExports: (dirPath: string, leafPath: string) => Array<ast.ExportNode>
}

function getExportNames({ item, dirPath, ctx }: { item: ast.ExportNode; dirPath: string; ctx: WalkContext }): Array<string> {
  if (item.name != null) return [item.name].flat()

  const itemPath = posix.join(dirPath, item.path)
  const barrel = ctx.barrelFiles.get(itemPath)
  if (barrel) return barrel.exports.flatMap((item) => getExportNames({ item, dirPath: posix.dirname(barrel.path), ctx }))

  return ctx.sourceFiles.get(itemPath)?.sources.flatMap((source) => source.name || []) ?? []
}

/**
 * Builds the `index.ts` for `dirPath`. Keeps the first export of each name and reports later duplicates once per build.
 */
function makeBarrel(dirPath: string, exports: Array<ast.ExportNode>, ctx: WalkContext): ast.FileNode {
  const { reportedCollisions } = ctx
  const owners = new Map<string, string>()
  const uniqueExports = exports.flatMap((item) => {
    const itemPath = posix.join(dirPath, item.path)
    // A wildcard export carries no names, so collisions are checked against its source file.
    const names = getExportNames({ item, dirPath, ctx })
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

    if (item.name == null) return [item]
    return uniqueNames.length > 0 ? [ast.factory.createExport({ ...item, name: Array.isArray(item.name) ? uniqueNames : uniqueNames[0] })] : []
  })

  const file = ast.factory.createFile({ baseName: 'index.ts', path: `${dirPath}${BARREL_SUFFIX}`, exports: uniqueExports })
  ctx.barrelFiles.set(file.path, file)
  return file
}

type LeafStrategy = (path: string, sourceFile: ast.FileNode | undefined) => Array<ast.ExportNode>

function indexableNames(sources: ReadonlyArray<ast.SourceNode>, isTypeOnly: boolean): Array<string> {
  const names = sources.flatMap((source) => (source.isIndexable && source.name && Boolean(source.isTypeOnly) === isTypeOnly ? [source.name] : []))
  return [...new Set(names)].sort()
}

/**
 * Re-exports the whole module, unless it has sources and none of them is indexable.
 */
const allStrategy: LeafStrategy = (path, sourceFile) => {
  const sources = sourceFile?.sources ?? []
  return sources.length > 0 && !sources.some((source) => source.isIndexable) ? [] : [ast.factory.createExport({ path })]
}

/**
 * Re-exports the indexable names, values and types separately, or the whole module when it has no sources.
 */
const namedStrategy: LeafStrategy = (path, sourceFile) => {
  if (!sourceFile?.sources.length) return [ast.factory.createExport({ path })]

  const valueNames = indexableNames(sourceFile.sources, false)
  const typeNames = indexableNames(sourceFile.sources, true)
  return [
    ...(valueNames.length > 0 ? [ast.factory.createExport({ name: valueNames, path })] : []),
    ...(typeNames.length > 0 ? [ast.factory.createExport({ name: typeNames, path, isTypeOnly: true })] : []),
  ]
}

type FlatWalk = { barrels: Array<ast.FileNode>; leaves: Array<string> }

/**
 * Post-order walk that builds a barrel re-exporting every leaf below the visited directory, for
 * the start node and, with `recursive`, every sub-directory. Also returns the subtree's leaf paths.
 */
function walkFlat(node: DirectoryNode, ctx: WalkContext, isRoot = true): FlatWalk {
  const results = sortedChildren(node).map((child): FlatWalk => (child.children ? walkFlat(child, ctx, false) : { barrels: [], leaves: [child.path] }))
  const barrels = results.flatMap((result) => result.barrels)
  const leaves = results.flatMap((result) => result.leaves)
  const exports = isRoot || ctx.recursive ? leaves.flatMap((leaf) => ctx.leafExports(node.path, leaf)) : []
  if (isRoot) exports.push(...ctx.additionalExports)

  return { barrels: exports.length > 0 ? [...barrels, makeBarrel(node.path, exports, ctx)] : barrels, leaves }
}

/**
 * Recursive walk that builds one barrel per directory, re-exporting files and sub-barrels.
 * Used when nested: true. Leaf files honor the barrel `strategy`, so `named` emits explicit
 * named exports instead of wildcards. Sub-directory barrels are chained with a wildcard
 * re-export, which forwards the names the child barrel already curated. A sub-directory that
 * produced no barrel is never re-exported.
 */
function walkNested(node: DirectoryNode, ctx: WalkContext): Array<ast.FileNode> {
  const results = sortedChildren(node).map((child) => {
    if (!child.children) return { barrels: [], exports: ctx.leafExports(node.path, child.path) }

    // A sub-directory has barrels only when it has its own `index.ts`.
    const barrels = walkNested(child, { ...ctx, namespace: false })
    const exports = barrels.length > 0 ? [ast.factory.createExport({ path: toRelativeModulePath(node.path, `${child.path}${BARREL_SUFFIX}`) })] : []
    if (ctx.namespace && barrels.length > 0) {
      const name = pascalCase(posix.basename(child.path))
      exports.push(
        ast.factory.createExport({
          path: toRelativeModulePath(node.path, `${child.path}${BARREL_SUFFIX}`),
          name: /^[A-Za-z]/.test(name) ? name : `_${name}`,
          asAlias: true,
        }),
      )
    }
    return { barrels, exports }
  })
  const barrels = results.flatMap((result) => result.barrels)
  const exports = results.flatMap((result) => result.exports)

  return exports.length > 0 ? [...barrels, makeBarrel(node.path, exports, ctx)] : barrels
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
  const sourceFiles = new Map(
    files.flatMap((file) => {
      const filePath = toPosixPath(file.path)
      const isSource = filePath.startsWith(`${tree.path}/`) && !filePath.endsWith(BARREL_SUFFIX) && SOURCE_EXTENSIONS.has(extname(filePath))
      return isSource ? [[filePath, file] as const] : []
    }),
  )

  for (const filePath of sourceFiles.keys()) {
    const parts = filePath
      .slice(tree.path.length + 1)
      .split('/')
      .filter(Boolean)
    parts.reduce<DirectoryNode>((dir, part, i) => {
      const path = `${dir.path}/${part}`
      const child: TreeNode = dir.children.get(part) ?? (i === parts.length - 1 ? { path } : { path, children: new Map() })
      dir.children.set(part, child)
      return child.children ? child : dir
    }, tree)
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

  const node = targetPath
    .slice(tree.path.length + 1)
    .split('/')
    .reduce<TreeNode | undefined>((current, part) => current?.children?.get(part), tree)
  return node?.children ? node : undefined
}

type GetBarrelFilesParams = {
  /**
   * Index built once via {@link buildBarrelIndex} for the shared output root.
   */
  index: BarrelIndex
  /** Absolute directory to root the barrel(s) at, a subtree of the index root. Defaults to the index root. */
  targetPath?: string
  /** `'all'` re-exports whole modules (`export * from './x'`), `'named'` only the indexable named symbols. */
  barrelType: BarrelType
  /** One `index.ts` per sub-directory, each re-exporting only what is directly inside it. */
  nested?: boolean
  /** Add PascalCase namespace exports for immediate subdirectories and enable nested barrels. */
  namespace?: boolean
  /** Extra exports to forward from plugin barrels into the root barrel. */
  additionalExports?: ReadonlyArray<ast.ExportNode>
  /** Also generate a barrel for each sub-directory when `nested` is false. */
  recursive?: boolean
  /**
   * Collision identities reported by related barrel generations in the same build.
   */
  reportedCollisions?: Set<string>
}

/**
 * Returns the barrel `ast.FileNode`s for `targetPath` (or the index root), derived from a shared index.
 * Locating the subtree is a bounded walk down from the root, so deriving many barrels (one per
 * plugin, plus the root) from one index avoids re-scanning the full file set for each.
 *
 * @example
 * ```ts
 * const index = buildBarrelIndex(outputPath, files)
 * getBarrelFiles({ index, targetPath, barrelType }).forEach((file) => upsertFile(file))
 * ```
 */
export function getBarrelFiles({
  index,
  targetPath,
  barrelType,
  nested = false,
  namespace = false,
  additionalExports = [],
  recursive = false,
  reportedCollisions = new Set(),
}: GetBarrelFilesParams): Array<ast.FileNode> {
  const node = targetPath ? findDirectory(index.tree, toPosixPath(targetPath)) : index.tree
  if (!node) return []

  const strategy = barrelType === 'named' ? namedStrategy : allStrategy
  const ctx: WalkContext = {
    sourceFiles: index.sourceFiles,
    barrelFiles: new Map(),
    reportedCollisions,
    recursive,
    namespace,
    additionalExports,
    leafExports: (dirPath, leafPath) => strategy(toRelativeModulePath(dirPath, leafPath), index.sourceFiles.get(leafPath)),
  }

  return nested || namespace ? walkNested(node, ctx) : walkFlat(node, ctx).barrels
}

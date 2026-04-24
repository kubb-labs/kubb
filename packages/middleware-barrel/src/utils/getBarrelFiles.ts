import { extname } from 'node:path'
import { createExport, createFile } from '@kubb/ast'
import type { ExportNode, FileNode, SourceNode } from '@kubb/ast'
import { BARREL_FILENAME } from '../constants.ts'
import type { BarrelType } from '../types.ts'
import { type BuildTree, buildTree } from '@internals/utils'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const BARREL_SUFFIX = `/${BARREL_FILENAME}`

/**
 * Derives a relative module specifier from `filePath` relative to `fromDir`.
 * The source extension is preserved so `@kubb/parser-ts` can apply its `extNames` mapping.
 *
 * @example
 * ```ts
 * toRelativeModulePath('/src/gen/types', '/src/gen/types/pet.ts') // './pet.ts'
 * toRelativeModulePath('/src/gen/types', '/src/gen/types/tags/tag.ts') // './tags/tag.ts'
 * ```
 */
function toRelativeModulePath(fromDir: string, filePath: string): string {
  return `./${filePath.slice(fromDir.length + 1)}`
}

function isBarrelPath(path: string): boolean {
  return path.endsWith(BARREL_SUFFIX)
}

function makeBarrel(dirPath: string, exports: Array<ExportNode>): FileNode {
  return createFile({
    baseName: BARREL_FILENAME,
    path: `${dirPath}${BARREL_SUFFIX}`,
    exports,
    sources: [],
    imports: [],
  })
}

type LeafContext = {
  dirPath: string
  leafPath: string
  sourceFile: FileNode | undefined
}

type LeafStrategy = (ctx: LeafContext) => Array<ExportNode>

function hasOnlyNonIndexableSources(sources: ReadonlyArray<SourceNode>): boolean {
  if (sources.length === 0) return false
  for (const source of sources) {
    if (source.isIndexable) return false
  }
  return true
}

function partitionIndexableNames(sources: ReadonlyArray<SourceNode>): Map<boolean, Set<string>> {
  const byTypeOnly = new Map<boolean, Set<string>>([
    [false, new Set()],
    [true, new Set()],
  ])
  for (const source of sources) {
    if (!source.isIndexable || !source.name) continue
    byTypeOnly.get(Boolean(source.isTypeOnly))!.add(source.name)
  }
  return byTypeOnly
}

const allStrategy: LeafStrategy = ({ dirPath, leafPath, sourceFile }) => {
  if (sourceFile && hasOnlyNonIndexableSources(sourceFile.sources)) return []
  return [createExport({ path: toRelativeModulePath(dirPath, leafPath) })]
}

const namedStrategy: LeafStrategy = ({ dirPath, leafPath, sourceFile }) => {
  const modulePath = toRelativeModulePath(dirPath, leafPath)

  if (!sourceFile) return [createExport({ path: modulePath })]

  const namesByTypeOnly = partitionIndexableNames(sourceFile.sources)
  const valueNames = namesByTypeOnly.get(false)!
  const typeNames = namesByTypeOnly.get(true)!

  if (valueNames.size === 0 && typeNames.size === 0) {
    if (sourceFile.sources.length > 0) return []
    return [createExport({ path: modulePath })]
  }

  const exports: Array<ExportNode> = []
  if (valueNames.size > 0) {
    exports.push(createExport({ name: [...valueNames].sort(), path: modulePath }))
  }
  if (typeNames.size > 0) {
    exports.push(createExport({ name: [...typeNames].sort(), path: modulePath, isTypeOnly: true }))
  }
  return exports
}

const LEAF_STRATEGIES: ReadonlyMap<Exclude<BarrelType, 'propagate'>, LeafStrategy> = new Map([
  ['all', allStrategy],
  ['named', namedStrategy],
])

type LeafWalkParams = {
  sourceFiles: ReadonlyMap<string, FileNode>
  strategy: LeafStrategy
  recursive: boolean
}

/**
 * Single-pass post-order traversal that emits a barrel for each visited directory and
 * returns its leaf paths so parents don't have to re-walk the subtree.
 */
function walkAllOrNamed(node: BuildTree, params: LeafWalkParams, isRoot: boolean, out: Array<FileNode>): Array<string> {
  const subtreeLeaves: Array<string> = []

  for (const child of node.children) {
    if (child.isFile) {
      if (!isBarrelPath(child.path)) subtreeLeaves.push(child.path)
      continue
    }

    const childLeaves = walkAllOrNamed(child, params, false, out)
    for (const leaf of childLeaves) subtreeLeaves.push(leaf)
  }

  // Sub-directory barrels are only emitted when the caller asked for them.
  if (!isRoot && !params.recursive) return subtreeLeaves

  const exports = subtreeLeaves.flatMap((leafPath) => params.strategy({ dirPath: node.path, leafPath, sourceFile: params.sourceFiles.get(leafPath) }))

  if (exports.length > 0) {
    out.push(makeBarrel(node.path, exports))
  }

  return subtreeLeaves
}

/**
 * Emits one barrel per directory: every direct child file is re-exported and every
 * sub-directory is re-exported via its own barrel (recursive by design).
 */
function walkPropagate(node: BuildTree, out: Array<FileNode>): void {
  const exports: Array<ExportNode> = []

  for (const child of node.children) {
    if (child.isFile) {
      if (isBarrelPath(child.path)) continue
      exports.push(createExport({ path: toRelativeModulePath(node.path, child.path) }))
      continue
    }

    walkPropagate(child, out)
    exports.push(createExport({ path: toRelativeModulePath(node.path, `${child.path}${BARREL_SUFFIX}`) }))
  }

  if (exports.length > 0) {
    out.push(makeBarrel(node.path, exports))
  }
}

type IndexedFiles = {
  /**
   * `path → FileNode` lookup limited to files that participate in barrel generation.
   */
  sourceFiles: ReadonlyMap<string, FileNode>
  /**
   * Original (un-normalized) paths of `sourceFiles`, in input order — used as input for {@link buildTree}.
   */
  paths: ReadonlyArray<string>
}

function indexRelevantFiles(files: ReadonlyArray<FileNode>, outputPath: string): IndexedFiles {
  const outputPrefix = `${outputPath.replaceAll('\\', '/')}/`
  const sourceFiles = new Map<string, FileNode>()
  const paths: Array<string> = []

  for (const file of files) {
    const normalized = file.path.replaceAll('\\', '/')
    if (!normalized.startsWith(outputPrefix)) continue
    if (isBarrelPath(normalized)) continue
    if (!SOURCE_EXTENSIONS.has(extname(normalized))) continue

    sourceFiles.set(file.path, file)
    paths.push(file.path)
  }

  return { sourceFiles, paths }
}

export type GetBarrelFilesParams = {
  /**
   * Absolute path to the directory the barrel(s) should be rooted at.
   * Files outside this directory are ignored.
   */
  outputPath: string
  /**
   * Full set of generated files across all plugins.
   * Used both to discover what to re-export and to read each file's indexable sources.
   */
  files: ReadonlyArray<FileNode>
  /**
   * Re-export style used in the generated barrel(s).
   */
  barrelType: BarrelType
  /**
   * When `true`, also generate a barrel for each sub-directory of `outputPath`.
   * Used by per-plugin barrels so that grouped output (e.g. `petController/`) gets its own `index.ts`.
   *
   * Has no effect for `barrelType: 'propagate'`, which always recurses by design.
   *
   * @default false
   */
  recursive?: boolean
}

/**
 * Generates barrel `FileNode`s for the directory rooted at `outputPath`.
 *
 * Files outside `outputPath`, existing barrel files, and non-source extensions are filtered out
 * before the tree is built.
 */
export function getBarrelFiles({ outputPath, files, barrelType, recursive = false }: GetBarrelFilesParams): Array<FileNode> {
  const { sourceFiles, paths } = indexRelevantFiles(files, outputPath)
  if (paths.length === 0) return []

  const tree = buildTree(outputPath, paths)
  const result: Array<FileNode> = []

  if (barrelType === 'propagate') {
    walkPropagate(tree, result)
    return result
  }

  const strategy = LEAF_STRATEGIES.get(barrelType)
  if (!strategy) return result

  walkAllOrNamed(tree, { sourceFiles, strategy, recursive }, true, result)
  return result
}

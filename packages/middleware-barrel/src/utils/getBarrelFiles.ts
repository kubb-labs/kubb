import { extname } from 'node:path'
import { createExport, createFile } from '@kubb/ast'
import type { ExportNode, FileNode, SourceNode } from '@kubb/ast'
import { BARREL_FILENAME } from '../constants.ts'
import type { BarrelType } from '../types.ts'
import { type BuildTree, buildTree, toPosixPath } from '@internals/utils'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const BARREL_SUFFIX = `/${BARREL_FILENAME}`

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
    // Barrel files must never carry a banner or footer: they only re-export
    // symbols and adding a directive like "use server" would break consumers.
    banner: undefined,
    footer: undefined,
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

const LEAF_STRATEGIES: ReadonlyMap<BarrelType, LeafStrategy> = new Map([
  ['all', allStrategy],
  ['named', namedStrategy],
])

type LeafWalkParams = {
  sourceFiles: ReadonlyMap<string, FileNode>
  strategy: LeafStrategy
  recursive: boolean
}

/**
 * Post-order walk that emits a barrel per visited directory.
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

  if (!isRoot && !params.recursive) return subtreeLeaves

  const exports = subtreeLeaves.flatMap((leafPath) => params.strategy({ dirPath: node.path, leafPath, sourceFile: params.sourceFiles.get(leafPath) }))

  if (exports.length > 0) {
    out.push(makeBarrel(node.path, exports))
  }

  return subtreeLeaves
}

/**
 * Recursive walk that emits one barrel per directory, re-exporting files and sub-barrels.
 * Used when nested: true.
 */
function walkNested(node: BuildTree, out: Array<FileNode>): void {
  const exports: Array<ExportNode> = []

  for (const child of node.children) {
    if (child.isFile) {
      if (isBarrelPath(child.path)) continue
      exports.push(createExport({ path: toRelativeModulePath(node.path, child.path) }))
      continue
    }

    walkNested(child, out)
    exports.push(createExport({ path: toRelativeModulePath(node.path, `${child.path}${BARREL_SUFFIX}`) }))
  }

  if (exports.length > 0) {
    out.push(makeBarrel(node.path, exports))
  }
}

type IndexedFiles = {
  sourceFiles: ReadonlyMap<string, FileNode>
  paths: ReadonlyArray<string>
}

function indexRelevantFiles(files: ReadonlyArray<FileNode>, outputPath: string): IndexedFiles {
  const outputPrefix = `${toPosixPath(outputPath)}/`
  const sourceFiles = new Map<string, FileNode>()
  const paths: Array<string> = []

  for (const file of files) {
    const normalized = toPosixPath(file.path)
    if (!normalized.startsWith(outputPrefix)) continue
    if (isBarrelPath(normalized)) continue
    if (!SOURCE_EXTENSIONS.has(extname(normalized))) continue

    sourceFiles.set(normalized, file)
    paths.push(normalized)
  }

  return { sourceFiles, paths }
}

type GetBarrelFilesParams = {
  /**
   * Absolute directory the barrel(s) should be rooted at.
   * Only files living under this path are considered.
   */
  outputPath: string
  /**
   * Pool of generated files to scan for indexable sources.
   */
  files: ReadonlyArray<FileNode>
  /**
   * Export strategy used when emitting each barrel.
   * - `'all'` re-exports the whole module (`export * from './x'`)
   * - `'named'` re-exports only the indexable named symbols
   */
  barrelType: BarrelType
  /**
   * Generate an `index.ts` in every sub-directory, each re-exporting only what's directly inside it (hierarchical).
   * When false, uses flat generation strategy with optional recursive subdirectory barrels.
   *
   * @default false
   */
  nested?: boolean
  /**
   * Also generate a barrel for each sub-directory when nested is false.
   * No effect when nested is true (always generates hierarchical structure).
   *
   * @default false
   */
  recursive?: boolean
}

/**
 * Generates barrel `FileNode`s for the directory rooted at `outputPath`.
 */
export function getBarrelFiles({ outputPath, files, barrelType, nested = false, recursive = false }: GetBarrelFilesParams): Array<FileNode> {
  const { sourceFiles, paths } = indexRelevantFiles(files, outputPath)
  if (paths.length === 0) return []

  const tree = buildTree(outputPath, paths)
  const result: Array<FileNode> = []

  // Use nested walk for hierarchical barrel structure
  if (nested) {
    walkNested(tree, result)
    return result
  }

  const strategy = LEAF_STRATEGIES.get(barrelType)
  if (!strategy) return result

  walkAllOrNamed(tree, { sourceFiles, strategy, recursive }, true, result)
  return result
}

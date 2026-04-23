import { createExport, createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { BARREL_BASENAME, BARREL_FILENAME } from '../constants.ts'
import type { BarrelType } from '../types.ts'
import { buildTree, type TreeNode } from './TreeNode.ts'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

/**
 * Derives a relative module specifier (no extension) from an absolute `filePath`
 * relative to an absolute `fromDir`.
 *
 * @example
 * toRelativeModulePath('/src/gen/types', '/src/gen/types/pet.ts') // './pet'
 * toRelativeModulePath('/src/gen/types', '/src/gen/types/tags/tag.ts') // './tags/tag'
 */
function toRelativeModulePath(fromDir: string, filePath: string): string {
  const relative = filePath.slice(fromDir.length).replace(/^[/\\]/g, '')
  // Strip extension
  const withoutExt = relative.replace(/\.[^/.]+$/, '')
  return `./${withoutExt}`
}

/**
 * Generates barrel `FileNode[]` for a given directory tree node using the `'all'` strategy:
 * each leaf file gets a `export * from './relPath'` in the barrel of its nearest ancestor directory.
 *
 * Only a single barrel file (at `treeNode.path`) is generated — sub-directory files are referenced
 * with their full relative path from `treeNode.path`.
 */
function getBarrelFilesAll(treeNode: TreeNode, _sourceFiles: ReadonlyArray<FileNode>): Array<FileNode> {
  // Collect all source file paths under this node (excluding barrel files themselves)
  const leafPaths = collectLeafPaths(treeNode).filter((p) => !p.endsWith(`/${BARREL_FILENAME}`))

  if (leafPaths.length === 0) return []

  const barrelPath = `${treeNode.path}/${BARREL_FILENAME}`
  const exports = leafPaths.map((filePath) =>
    createExport({
      path: toRelativeModulePath(treeNode.path, filePath),
    }),
  )

  return [
    createFile({
      baseName: BARREL_FILENAME,
      path: barrelPath,
      exports,
      sources: [],
      imports: [],
    }),
  ]
}

/**
 * Generates barrel `FileNode[]` for a given directory tree node using the `'named'` strategy:
 * each indexable source in each leaf file gets an individual named `export { name } from '...'`.
 */
function getBarrelFilesNamed(treeNode: TreeNode, sourceFiles: ReadonlyArray<FileNode>): Array<FileNode> {
  const leafPaths = collectLeafPaths(treeNode).filter((p) => !p.endsWith(`/${BARREL_FILENAME}`))

  if (leafPaths.length === 0) return []

  const barrelPath = `${treeNode.path}/${BARREL_FILENAME}`
  const exports: ReturnType<typeof createExport>[] = []

  for (const filePath of leafPaths) {
    const sourceFile = sourceFiles.find((f) => f.path === filePath)
    if (!sourceFile) {
      // Fall back to wildcard if the source file is not in our set
      exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
      continue
    }

    const indexableSources = sourceFile.sources.filter((s) => s.isIndexable && s.name)
    if (indexableSources.length === 0) {
      // If the file has explicit sources but none are indexable, skip it entirely.
      // Only fall back to wildcard when there are no sources at all (unknown exports).
      if (sourceFile.sources.length > 0) continue
      exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
      continue
    }

    const names = indexableSources.map((s) => s.name as string)
    exports.push(
      createExport({
        name: names,
        path: toRelativeModulePath(treeNode.path, filePath),
      }),
    )
  }

  if (exports.length === 0) return []

  return [
    createFile({
      baseName: BARREL_FILENAME,
      path: barrelPath,
      exports,
      sources: [],
      imports: [],
    }),
  ]
}

/**
 * Generates barrel `FileNode[]` for a given directory tree node using the `'propagate'` strategy:
 * like `'all'` but also generates intermediate barrel files for every sub-directory, so that
 * consumers can import from any depth.
 *
 * Leaf barrels export directly from their files; parent barrels export from their sub-barrel files.
 */
function getBarrelFilesPropagate(treeNode: TreeNode): Array<FileNode> {
  return collectPropagatedBarrels(treeNode)
}

function collectPropagatedBarrels(node: TreeNode): Array<FileNode> {
  const result: Array<FileNode> = []
  const barrelExports: ReturnType<typeof createExport>[] = []

  for (const child of node.children) {
    if (child.isFile) {
      if (!child.path.endsWith(`/${BARREL_FILENAME}`)) {
        barrelExports.push(createExport({ path: toRelativeModulePath(node.path, child.path) }))
      }
    } else {
      // Recurse into sub-directory
      const subBarrels = collectPropagatedBarrels(child)
      result.push(...subBarrels)

      // Export the sub-directory's barrel (not individual files)
      const subBarrelPath = `${child.path}/${BARREL_BASENAME}`
      barrelExports.push(createExport({ path: toRelativeModulePath(node.path, subBarrelPath) }))
    }
  }

  if (barrelExports.length > 0) {
    result.push(
      createFile({
        baseName: BARREL_FILENAME,
        path: `${node.path}/${BARREL_FILENAME}`,
        exports: barrelExports,
        sources: [],
        imports: [],
      }),
    )
  }

  return result
}

/**
 * Collects all leaf (file) paths within a tree node recursively.
 */
function collectLeafPaths(node: TreeNode): Array<string> {
  if (node.isFile) return [node.path]
  return node.children.flatMap((c) => collectLeafPaths(c))
}

/**
 * Generates barrel `FileNode[]` for a directory rooted at `outputPath`, given the full set of
 * generated source `files`, using the specified `barrelType` strategy.
 *
 * Files not located inside `outputPath` are excluded automatically.
 *
 * @param outputPath Absolute path to the output directory.
 * @param files All generated files (across all plugins).
 * @param barrelType Barrel generation strategy.
 */
export function getBarrelFiles(outputPath: string, files: ReadonlyArray<FileNode>, barrelType: BarrelType): Array<FileNode> {
  // Only include files that live inside this outputPath and have a recognised source extension
  const relevantFiles = files.filter((f) => {
    const normalizedFilePath = f.path.replace(/\\/g, '/')
    const normalizedOutputPath = outputPath.replace(/\\/g, '/')
    if (!normalizedFilePath.startsWith(normalizedOutputPath + '/')) return false
    if (normalizedFilePath.endsWith(`/${BARREL_FILENAME}`)) return false
    const dotIndex = normalizedFilePath.lastIndexOf('.')
    const ext = dotIndex === -1 ? '' : normalizedFilePath.slice(dotIndex)
    return SOURCE_EXTENSIONS.has(ext)
  })

  if (relevantFiles.length === 0) return []

  const tree = buildTree(
    outputPath,
    relevantFiles.map((f) => f.path),
  )

  switch (barrelType) {
    case 'all':
      return getBarrelFilesAll(tree, relevantFiles)
    case 'named':
      return getBarrelFilesNamed(tree, relevantFiles)
    case 'propagate':
      return getBarrelFilesPropagate(tree)
    default:
      return []
  }
}

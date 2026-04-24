import { createExport, createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { BARREL_FILENAME } from '../constants.ts'
import type { BarrelType } from '../types.ts'
import { buildTree, type BuildTree } from './buildTree.ts'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

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
  const relative = filePath.slice(fromDir.length).replace(/^[/\\]/g, '')
  return `./${relative}`
}

type BarrelFilesParams = {
  treeNode: BuildTree
  sourceFiles: ReadonlyArray<FileNode>
  recursive?: boolean
}

function getBarrelFilesAll({ treeNode, sourceFiles, recursive = false }: BarrelFilesParams): Array<FileNode> {
  const leafPaths = collectLeafPaths(treeNode).filter((p) => !p.endsWith(`/${BARREL_FILENAME}`))

  if (leafPaths.length === 0) return []

  const exports: ReturnType<typeof createExport>[] = []

  for (const filePath of leafPaths) {
    const sourceFile = sourceFiles.find((f) => f.path === filePath)
    if (sourceFile && sourceFile.sources.length > 0 && sourceFile.sources.every((s) => !s.isIndexable)) {
      continue
    }
    exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
  }

  const result: Array<FileNode> = []

  if (recursive) {
    for (const child of treeNode.children) {
      if (!child.isFile) {
        result.push(...getBarrelFilesAll({ treeNode: child, sourceFiles, recursive: true }))
      }
    }
  }

  if (exports.length === 0) return result

  result.push(
    createFile({
      baseName: BARREL_FILENAME,
      path: `${treeNode.path}/${BARREL_FILENAME}`,
      exports,
      sources: [],
      imports: [],
    }),
  )

  return result
}

function getBarrelFilesNamed({ treeNode, sourceFiles, recursive = false }: BarrelFilesParams): Array<FileNode> {
  const leafPaths = collectLeafPaths(treeNode).filter((p) => !p.endsWith(`/${BARREL_FILENAME}`))

  if (leafPaths.length === 0) return []

  const exports: ReturnType<typeof createExport>[] = []

  for (const filePath of leafPaths) {
    const sourceFile = sourceFiles.find((f) => f.path === filePath)
    if (!sourceFile) {
      exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
      continue
    }

    const indexableSources = sourceFile.sources.filter((s) => s.isIndexable && s.name)
    if (indexableSources.length === 0) {
      if (sourceFile.sources.length > 0) continue
      exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
      continue
    }

    const valueNames = indexableSources.filter((s) => !s.isTypeOnly).map((s) => s.name as string)
    const typeNames = indexableSources.filter((s) => s.isTypeOnly).map((s) => s.name as string)
    const modulePath = toRelativeModulePath(treeNode.path, filePath)

    if (valueNames.length > 0) {
      exports.push(createExport({ name: valueNames, path: modulePath }))
    }
    if (typeNames.length > 0) {
      exports.push(createExport({ name: typeNames, path: modulePath, isTypeOnly: true }))
    }
  }

  const result: Array<FileNode> = []

  if (recursive) {
    for (const child of treeNode.children) {
      if (!child.isFile) {
        result.push(...getBarrelFilesNamed({ treeNode: child, sourceFiles, recursive: true }))
      }
    }
  }

  if (exports.length > 0) {
    result.push(
      createFile({
        baseName: BARREL_FILENAME,
        path: `${treeNode.path}/${BARREL_FILENAME}`,
        exports,
        sources: [],
        imports: [],
      }),
    )
  }

  return result
}

function getBarrelFilesPropagate({ treeNode }: Pick<BarrelFilesParams, 'treeNode'>): Array<FileNode> {
  return collectPropagatedBarrels(treeNode)
}

function collectPropagatedBarrels(node: BuildTree): Array<FileNode> {
  const result: Array<FileNode> = []
  const barrelExports: ReturnType<typeof createExport>[] = []

  for (const child of node.children) {
    if (child.isFile) {
      if (!child.path.endsWith(`/${BARREL_FILENAME}`)) {
        barrelExports.push(createExport({ path: toRelativeModulePath(node.path, child.path) }))
      }
    } else {
      const subBarrels = collectPropagatedBarrels(child)
      result.push(...subBarrels)

      const subBarrelPath = `${child.path}/${BARREL_FILENAME}`
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

function collectLeafPaths(node: BuildTree): Array<string> {
  if (node.isFile) return [node.path]
  return node.children.flatMap((c) => collectLeafPaths(c))
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
      return getBarrelFilesAll({ treeNode: tree, sourceFiles: relevantFiles, recursive })
    case 'named':
      return getBarrelFilesNamed({ treeNode: tree, sourceFiles: relevantFiles, recursive })
    case 'propagate':
      return getBarrelFilesPropagate({ treeNode: tree })
    default:
      return []
  }
}

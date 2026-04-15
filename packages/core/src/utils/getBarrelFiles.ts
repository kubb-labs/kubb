/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: not needed */
import { join } from 'node:path'
import { getRelativePath } from '@internals/utils'
import { createExport, createFile, createSource } from '@kubb/ast'
import type { FileNode } from '@kubb/ast/types'
import type { BarrelType } from '../types.ts'
import { TreeNode } from './TreeNode.ts'

export type FileMetaBase = {
  pluginName?: string
}

type AddIndexesProps = {
  type: BarrelType | false | undefined
  /**
   * Absolute output root derived from config `root` and `output.path`.
   */
  root: string
  /**
   * Output settings for the plugin.
   */
  output: {
    path: string
  }
  group?: {
    output: string
    exportAs: string
  }

  meta?: FileMetaBase
}

function getBarrelFilesByRoot(root: string | undefined, files: Array<FileNode>): Array<FileNode> {
  const cachedFiles = new Map<string, FileNode>()

  TreeNode.build(files, root)?.forEach((treeNode) => {
    if (!treeNode?.children || !treeNode.parent?.data.path) {
      return
    }

    const barrelFilePath = join(treeNode.parent?.data.path, 'index.ts')
    const barrelFile = createFile({
      path: barrelFilePath,
      baseName: 'index.ts',
      exports: [],
      imports: [],
      sources: [],
    })
    const previousBarrelFile = cachedFiles.get(barrelFile.path)
    const leaves = treeNode.leaves

    leaves.forEach((item) => {
      if (!item.data.name) {
        return
      }

      const sources = item.data.file?.sources || []

      sources.forEach((source) => {
        if (!item.data.file?.path || !source.isIndexable || !source.name) {
          return
        }
        const alreadyContainInPreviousBarrelFile = previousBarrelFile?.sources.some(
          (item) => item.name === source.name && item.isTypeOnly === source.isTypeOnly,
        )

        if (alreadyContainInPreviousBarrelFile) {
          return
        }

        barrelFile.exports.push(
          createExport({
            name: [source.name],
            path: getRelativePath(treeNode.parent?.data.path, item.data.path),
            isTypeOnly: source.isTypeOnly,
          }),
        )

        barrelFile.sources.push(
          createSource({
            name: source.name,
            isTypeOnly: source.isTypeOnly,
            isExportable: false,
            isIndexable: false,
          }),
        )
      })
    })

    if (previousBarrelFile) {
      previousBarrelFile.sources.push(...barrelFile.sources)
      previousBarrelFile.exports.push(...barrelFile.exports)
    } else {
      cachedFiles.set(barrelFile.path, barrelFile)
    }
  })

  return [...cachedFiles.values()]
}

function trimExtName(text: string): string {
  const dotIndex = text.lastIndexOf('.')
  // Only strip when the dot is found and no path separator follows it
  // (guards against stripping dots that are part of a directory name like /project.v2/gen)
  if (dotIndex > 0 && !text.includes('/', dotIndex)) {
    return text.slice(0, dotIndex)
  }
  return text
}

/**
 * Generates `index.ts` barrel files for all directories under `root/output.path`.
 *
 * - Returns an empty array when `type` is falsy or `'propagate'`.
 * - Skips generation when the output path itself ends with `index` (already a barrel).
 * - When `type` is `'all'`, strips named exports so every re-export becomes a wildcard (`export * from`).
 * - Attaches `meta` to each barrel file for downstream plugin identification.
 */
export async function getBarrelFiles(files: Array<FileNode>, { type, meta = {}, root, output }: AddIndexesProps): Promise<Array<FileNode>> {
  if (!type || type === 'propagate') {
    return []
  }

  const pathToBuildFrom = join(root, output.path)

  if (trimExtName(pathToBuildFrom).endsWith('index')) {
    return []
  }

  const barrelFiles = getBarrelFilesByRoot(pathToBuildFrom, files)

  if (type === 'all') {
    return barrelFiles.map((file) => {
      return {
        ...file,
        exports: file.exports.map((exportItem) => {
          return {
            ...exportItem,
            name: undefined,
          }
        }),
      } as FileNode
    })
  }

  return barrelFiles.map((indexFile) => {
    return {
      ...indexFile,
      meta,
    } as FileNode
  })
}

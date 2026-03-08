/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: not needed */
import { join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { getRelativePath } from './fs/index.ts'

import type { FileMetaBase } from './utils/getBarrelFiles.ts'
import { TreeNode } from './utils/TreeNode.ts'

export class BarrelManager {
  getFiles({ files: generatedFiles, root }: { files: KubbFile.File[]; root?: string; meta?: FileMetaBase | undefined }): Array<KubbFile.File> {
    const cachedFiles = new Map<KubbFile.Path, KubbFile.File>()

    TreeNode.build(generatedFiles, root)?.forEach((treeNode) => {
      if (!treeNode || !treeNode.children || !treeNode.parent?.data.path) {
        return
      }

      const barrelFile: KubbFile.File = {
        path: join(treeNode.parent?.data.path, 'index.ts') as KubbFile.Path,
        baseName: 'index.ts',
        exports: [],
        imports: [],
        sources: [],
      }
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

          barrelFile.exports!.push({
            name: [source.name],
            path: getRelativePath(treeNode.parent?.data.path, item.data.path),
            isTypeOnly: source.isTypeOnly,
          })

          barrelFile.sources.push({
            name: source.name,
            isTypeOnly: source.isTypeOnly,
            //TODO use parser to generate import
            value: '',
            isExportable: false,
            isIndexable: false,
          })
        })
      })

      if (previousBarrelFile) {
        previousBarrelFile.sources.push(...barrelFile.sources)
        previousBarrelFile.exports?.push(...(barrelFile.exports || []))
      } else {
        cachedFiles.set(barrelFile.path, barrelFile)
      }
    })

    return [...cachedFiles.values()]
  }
}

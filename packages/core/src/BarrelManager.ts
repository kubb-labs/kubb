import path from 'node:path'

import { TreeNode } from './utils/TreeNode.ts'

import { trimExtName } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import type { Logger } from './logger.ts'

export type BarrelManagerOptions = {
  logger?: Logger
}

export class BarrelManager {
  #options: BarrelManagerOptions

  constructor(options: BarrelManagerOptions = {}) {
    this.#options = options

    return this
  }

  getFiles(generatedFiles: KubbFile.File[], root?: string): Array<KubbFile.File> {
    const { logger } = this.#options

    const fileReducer = (files: Array<KubbFile.File>, treeNode: TreeNode | null) => {
      if (!treeNode || !treeNode.children) {
        return []
      }

      const indexPath: KubbFile.Path = path.join(treeNode.data.path, 'index.ts')

      const exports = treeNode.children
        .filter((item) => !!item.data.name)
        .flatMap((childTreeNode) => {
          const sources = childTreeNode.data.file?.sources || []

          if (!sources.some((source) => source.isExportable)) {
            logger?.emit('warning', `No exportable source found(source should have a name and isExportable):\n${JSON.stringify(sources, undefined, 2)}`)
          }

          return sources
            .filter((source) => source.isExportable)
            .map((source) => {
              const importPath: string = childTreeNode.data.file ? `./${childTreeNode.data.name}` : `./${childTreeNode.data.name}`

              return {
                name: [source.name],
                path: importPath,
                isTypeOnly: source.isTypeOnly,
              } as KubbFile.Export
            })
        })
        .filter(Boolean)

      if (exports.length) {
        files.push({
          path: indexPath,
          baseName: 'index.ts',
          exports,
          sources: exports.flatMap((item) => {
            if (Array.isArray(item.name)) {
              return item.name.map((name) => {
                return {
                  name: name,
                  isTypeOnly: item.isTypeOnly,
                  value: '',
                }
              })
            }
            return [
              {
                name: item.name,
                isTypeOnly: item.isTypeOnly,
                value: '',
              },
            ]
          }),
        })
      }

      treeNode.children.forEach((treeNode) => {
        fileReducer(files, treeNode)
      })

      return files
    }

    return fileReducer([], TreeNode.build(generatedFiles, root))
  }
}

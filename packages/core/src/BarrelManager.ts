import path from 'node:path'

import { TreeNode } from './utils/TreeNode.ts'

import { trimExtName } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { combineExports } from './FileManager.ts'

export type BarrelManagerOptions = {
  isTypeOnly?: boolean
  /**
   * Add .ts or .js
   */
  extName?: string
}

/**
 * Replace with the use of the FileManager exports/imports
 */
export class BarrelManager {
  #options: BarrelManagerOptions

  constructor(options: BarrelManagerOptions = {}) {
    this.#options = options

    return this
  }

  getFiles(generatedFiles: KubbFile.File[], root?: string): Array<KubbFile.File> {
    const { extName } = this.#options

    const fileReducer = (files: Array<KubbFile.File>, treeNode: TreeNode | null) => {
      if (!treeNode || !treeNode.children) {
        return []
      }

      const indexPath: KubbFile.Path = path.join(treeNode.data.path, 'index.ts')

      const exports = treeNode.children
        .filter((item) => !!item.data.name)
        .flatMap((childTreeNode) => {
          const sources = childTreeNode.data.file?.sources || []

          if(!sources
            .some((source) => source.isExportable)){
            console.warn("No exportable sources found(source should have a name and isExportable")
          }

          return sources
            .filter((source) => source.isExportable)
            .map((source) => {
              const importPath: string = childTreeNode.data.file ? `./${trimExtName(childTreeNode.data.name)}` : `./${childTreeNode.data.name}`

              return {
                name: [source.name],
                path: extName ? `${importPath}${extName}` : importPath,
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

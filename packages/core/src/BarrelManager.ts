import path from 'node:path'

import { TreeNode } from './utils/TreeNode.ts'

import type * as KubbFile from '@kubb/fs/types'
import { trimExtName } from '@kubb/fs'

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

  getIndexes(generatedFiles: KubbFile.File[], root: string): Array<KubbFile.File> | null {
    const { isTypeOnly, extName } = this.#options
    const tree = TreeNode.build(generatedFiles, root)

    if (!tree) {
      return null
    }

    const fileReducer = (files: Array<KubbFile.File>, treeNode: TreeNode) => {
      if (!treeNode.children) {
        return []
      }

      const indexPath: KubbFile.Path = path.resolve(treeNode.data.path, 'index.ts')

      const exports: Array<KubbFile.Export> = treeNode.children
        .filter((item) => !!item.data.name)
        .map((treeNode) => {
          const importPath: string = treeNode.data.file ? `./${trimExtName(treeNode.data.name)}` : `./${treeNode.data.name}/index`

          if (importPath.endsWith('index') && treeNode.data.file) {
            return undefined
          }

          return {
            path: extName ? `${importPath}${extName}` : importPath,
            isTypeOnly,
          } as KubbFile.Export
        })
        .filter(Boolean)

      files.push({
        path: indexPath,
        baseName: 'index.ts',
        exports,
        sources: [],
      })

      treeNode.children.forEach((childItem) => {
        fileReducer(files, childItem)
      })

      return files
    }

    return fileReducer([], tree).reverse()
  }
}

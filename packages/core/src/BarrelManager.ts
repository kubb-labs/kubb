import path from 'node:path'

import { trimExtName } from './transformers/trim.ts'
import { TreeNode } from './utils/TreeNode.ts'

import type * as KubbFile from '@kubb/fs/types'

export type BarrelManagerOptions = {
  isTypeOnly?: boolean
  /**
   * Add .ts or .js
   */
  extName?: KubbFile.Extname
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

      if (treeNode.children.length > 1) {
        const indexPath: KubbFile.Path = path.resolve(treeNode.data.path, 'index.ts')

        const exports: Array<KubbFile.Export> = treeNode.children
          .filter(Boolean)
          .map((file) => {
            const importPath: string = file.data.type === 'split' ? `./${file.data.name}/index` : `./${trimExtName(file.data.name)}`

            if (importPath.endsWith('index') && file.data.type === 'single') {
              return undefined
            }

            console.log(file.leaves.map(d=>d.data.file?.exports))

            return {
              name: ['test'],
              path: extName ? `${importPath}${extName}` : importPath,
              isTypeOnly,
            } as KubbFile.Export
          })
          .filter(Boolean)

        files.push({
          path: indexPath,
          baseName: 'index.ts',
          source: '',
          exports,
          exportable: true,
        })
      } else if (treeNode.children.length === 1) {
        const [treeNodeChild] = treeNode.children as [TreeNode]

        const indexPath = path.resolve(treeNode.data.path, 'index.ts')
        const importPath = treeNodeChild.data.type === 'split' ? `./${treeNodeChild.data.name}/index` : `./${trimExtName(treeNodeChild.data.name)}`

        const exports = [
          {
            path: extName ? `${importPath}${extName}` : importPath,
            isTypeOnly,
          },
        ]

        files.push({
          path: indexPath,
          baseName: 'index.ts',
          source: '',
          exports,
          exportable: true,
        })
      }

      treeNode.children.forEach((childItem) => {
        fileReducer(files, childItem)
      })

      return files
    }

    return fileReducer([], tree).reverse()
  }
}

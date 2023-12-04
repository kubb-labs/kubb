import path from 'path'

import { trimExtName } from './transformers/trim.ts'
import { TreeNode } from './utils/TreeNode.ts'

import type { DirectoryTreeOptions } from 'directory-tree'
import type { KubbFile } from './FileManager.ts'
import type { KubbPlugin } from './index.ts'

type FileMeta = {
  pluginKey?: KubbPlugin['key']
  treeNode: TreeNode
}

export type BarrelManagerOptions = {
  treeNode?: DirectoryTreeOptions
  isTypeOnly?: boolean
  /**
   * Add .ts or .js
   */
  extName?: KubbFile.Extname
}

export class BarrelManager {
  #options: BarrelManagerOptions

  constructor(options: BarrelManagerOptions = {}) {
    this.#options = options

    return this
  }

  getIndexes(
    pathToBuild: string,
  ): Array<KubbFile.File<FileMeta>> | null {
    const { treeNode = {}, isTypeOnly, extName } = this.#options
    const tree = TreeNode.build(pathToBuild, treeNode)

    if (!tree) {
      return null
    }

    const fileReducer = (files: Array<KubbFile.File<FileMeta>>, treeNode: TreeNode) => {
      if (!treeNode.children) {
        return []
      }

      if (treeNode.children.length > 1) {
        const indexPath: KubbFile.Path = path.resolve(treeNode.data.path, 'index.ts')

        const exports: KubbFile.Export[] = treeNode.children
          .filter(Boolean)
          .map((file) => {
            const importPath: string = file.data.type === 'directory' ? `./${file.data.name}/index` : `./${trimExtName(file.data.name)}`

            if (importPath.endsWith('index') && file.data.type === 'file') {
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
          source: '',
          exports,
          meta: {
            treeNode,
          },
        })
      } else if (treeNode.children.length === 1) {
        const [treeNodeChild] = treeNode.children as [TreeNode]

        const indexPath = path.resolve(treeNode.data.path, 'index.ts')
        const importPath = treeNodeChild.data.type === 'directory'
          ? `./${treeNodeChild.data.name}/index`
          : `./${trimExtName(treeNodeChild.data.name)}`

        const exports = [
          {
            path: extName
              ? `${importPath}${extName}`
              : importPath,
            isTypeOnly,
          },
        ]

        files.push({
          path: indexPath,
          baseName: 'index.ts',
          source: '',
          exports,
          meta: {
            treeNode,
          },
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

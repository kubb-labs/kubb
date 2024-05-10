import { getExports } from '@kubb/parser-ts'

import path from 'node:path'

import { trimExtName } from './transformers/trim.ts'
import { TreeNode } from './utils/TreeNode.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { DirectoryTreeOptions } from 'directory-tree'

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

  getNamedExport(root: string, item: KubbFile.Export): KubbFile.Export[] {
    const exportedNames = getExports(path.resolve(root, item.path))

    if (!exportedNames) {
      return [item]
    }

    return exportedNames.reduce(
      (prev, curr) => {
        if (!prev[0]?.name || !prev[1]?.name) {
          return prev
        }

        if (curr.isTypeOnly) {
          prev[1] = { ...prev[1], name: [...prev[1].name, curr.name] }
        } else {
          prev[0] = { ...prev[0], name: [...prev[0].name, curr.name] }
        }

        return prev
      },
      [
        {
          ...item,
          name: [],
          isTypeOnly: false,
        },
        {
          ...item,
          name: [],
          isTypeOnly: true,
        },
      ] as KubbFile.Export[],
    )
  }

  getNamedExports(root: string, exports: KubbFile.Export[]): KubbFile.Export[] {
    return exports?.flatMap((item) => {
      return this.getNamedExport(root, item)
    })
  }

  getIndexes(root: string): Array<KubbFile.File> | null {
    const { treeNode = {}, isTypeOnly, extName } = this.#options
    const tree = TreeNode.build(root, treeNode)

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

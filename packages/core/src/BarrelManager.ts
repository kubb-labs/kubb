import path from 'path'

import { TreeNode } from './utils/TreeNode.ts'

import type { DirectoryTreeOptions } from 'directory-tree'
import type { KubbFile } from './FileManager.ts'

type BarrelData = { type: KubbFile.Mode; path: KubbFile.Path; name: string }

export type BarrelManagerOptions = {
  treeNode?: DirectoryTreeOptions
  isTypeOnly?: boolean
  filter?: (file: KubbFile.File) => boolean
  map?: (file: KubbFile.File) => KubbFile.File
  includeExt?: boolean
  output?: string
}

export class BarrelManager {
  #options: BarrelManagerOptions = {}

  constructor(options: BarrelManagerOptions = {}) {
    this.#options = options

    return this
  }

  getIndexes(
    root: string,
    extName?: KubbFile.Extname,
  ): Array<KubbFile.File> | null {
    const { treeNode = {}, isTypeOnly, filter, map, output, includeExt } = this.#options

    const extMapper: Record<KubbFile.Extname, DirectoryTreeOptions> = {
      '.ts': {
        extensions: /\.ts/,
        exclude: [/schemas/, /json/],
      },
      '.json': {
        extensions: /\.json/,
        exclude: [],
      },
    }
    const tree = TreeNode.build<BarrelData>(root, { ...(extMapper[extName as keyof typeof extMapper] || {}), ...treeNode })

    if (!tree) {
      return null
    }

    const fileReducer = (files: Array<KubbFile.File>, currentTree: typeof tree) => {
      if (!currentTree.children) {
        return []
      }

      if (currentTree.children?.length > 1) {
        const indexPath: KubbFile.Path = path.resolve(currentTree.data.path, 'index.ts')
        const exports: KubbFile.Export[] = currentTree.children
          .filter(Boolean)
          .map((file) => {
            const importPath: string = file.data.type === 'directory' ? `./${file.data.name}` : `./${file.data.name.replace(/\.[^.]*$/, '')}`

            // TODO weird hacky fix
            if (importPath.includes('index') && indexPath.includes('index')) {
              return undefined
            }

            return {
              path: includeExt ? (file.data.type === 'directory' ? `${importPath}/index${extName}` : `${importPath}${extName}`) : importPath,
              isTypeOnly,
            } as KubbFile.Export
          })
          .filter(Boolean)

        files.push({
          path: indexPath,
          baseName: 'index.ts',
          source: '',
          exports: output
            ? exports?.filter((item) => {
              return item.path.endsWith(output.replace(/\.[^.]*$/, ''))
            })
            : exports,
        })
      } else {
        currentTree.children?.forEach((child) => {
          const indexPath = path.resolve(currentTree.data.path, 'index.ts')
          const importPath = child.data.type === 'directory' ? `./${child.data.name}` : `./${child.data.name.replace(/\.[^.]*$/, '')}`

          const exports = [
            {
              path: includeExt ? (child.data.type === 'directory' ? `${importPath}/index${extName}` : `${importPath}${extName}`) : importPath,
              isTypeOnly,
            },
          ]

          files.push({
            path: indexPath,
            baseName: 'index.ts',
            source: '',
            exports: output
              ? exports?.filter((item) => {
                return item.path.endsWith(output.replace(/\.[^.]*$/, ''))
              })
              : exports,
          })
        })
      }

      currentTree.children.forEach((childItem) => {
        fileReducer(files, childItem)
      })

      return files
    }

    const files = fileReducer([], tree).reverse()

    const filteredFiles = filter ? files.filter(filter) : files

    return map ? filteredFiles.map(map) : filteredFiles
  }
}

import pathParser from 'path'

import type { File } from '@kubb/core'
import { TreeNode, write } from '@kubb/core'

import { createExportDeclaration } from './codegen'
import { print } from './print'

import type ts from 'typescript'

export function writeIndexes(root: string, output: string, options: Parameters<typeof TreeNode.build>[1]) {
  const tree = TreeNode.build(output, { extensions: /\.ts/, ...options })

  if (!tree) {
    return undefined
  }

  const fileReducer = (files: File[], item: typeof tree) => {
    if (!item.children) {
      return []
    }

    if (item.children?.length > 1) {
      const path = pathParser.resolve(root, item.data.path, 'index.ts')
      const nodes = item.children
        .map((file) => {
          if (!file) {
            return undefined
          }

          const importPath: string = file.data.type === 'directory' ? `./${file.data.name}` : `./${file.data.name.replace(/\.[^.]*$/, '')}`

          // TODO weird hacky fix
          if (importPath.includes('index') && path.includes('index')) {
            return undefined
          }

          return createExportDeclaration({
            path: importPath,
          })
        })
        .filter(Boolean) as ts.ExportDeclaration[]
      const source = print(nodes)

      files.push({
        path,
        fileName: 'index.ts',
        source,
      })
    } else {
      item.children?.forEach((child) => {
        const path = pathParser.resolve(root, item.data.path, 'index.ts')
        const importPath = child.data.type === 'directory' ? `./${child.data.name}` : `./${child.data.name.replace(/\.[^.]*$/, '')}`

        const node = createExportDeclaration({
          path: importPath,
        })
        const source = print(node)
        files.push({
          path,
          fileName: 'index.ts',
          source,
        })
      })
    }

    item.children.forEach((childItem) => {
      fileReducer(files, childItem)
    })

    return files
  }

  const files = fileReducer([], tree)

  return files.map((file) => write(file.source, file.path))
}

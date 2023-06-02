import pathParser from 'node:path'

import uniq from 'lodash.uniq'

import { createImportDeclaration, createExportDeclaration, print } from '@kubb/ts-codegen'

import { TreeNode } from '../../utils/index.ts'

import type { PathMode, TreeNodeOptions } from '../../utils/index.ts'
import type { Path } from '../../types.ts'
import type ts from 'typescript'
import type { File } from './types.ts'

export function writeIndexes(root: string, options: TreeNodeOptions) {
  const tree = TreeNode.build<{ type: PathMode; path: Path; name: string }>(root, { extensions: /\.ts/, ...options })

  if (!tree) {
    return undefined
  }

  const fileReducer = (files: File[], item: typeof tree) => {
    if (!item.children) {
      return []
    }

    if (item.children?.length > 1) {
      const path = pathParser.resolve(item.data.path, 'index.ts')
      const exports = item.children
        .map((file) => {
          if (!file) {
            return undefined
          }

          const importPath: string = file.data.type === 'directory' ? `./${file.data.name}` : `./${file.data.name.replace(/\.[^.]*$/, '')}`

          // TODO weird hacky fix
          if (importPath.includes('index') && path.includes('index')) {
            return undefined
          }

          return { path: importPath }
        })
        .filter(Boolean) as File['exports']

      files.push({
        path,
        fileName: 'index.ts',
        source: '',
        exports,
      })
    } else {
      item.children?.forEach((child) => {
        const path = pathParser.resolve(item.data.path, 'index.ts')
        const importPath = child.data.type === 'directory' ? `./${child.data.name}` : `./${child.data.name.replace(/\.[^.]*$/, '')}`

        files.push({
          path,
          fileName: 'index.ts',
          source: '',
          exports: [{ path: importPath }],
        })
      })
    }

    item.children.forEach((childItem) => {
      fileReducer(files, childItem)
    })

    return files
  }

  const files = fileReducer([], tree)

  return files
}

export function combineFiles(files: Array<File | null>) {
  return files.filter(Boolean).reduce((acc, curr: File | null) => {
    if (!curr) {
      return acc
    }
    const prevIndex = acc.findIndex((item) => item.path === curr.path)

    if (prevIndex !== -1) {
      const prev = acc[prevIndex]
      acc[prevIndex] = {
        ...curr,
        source: `${prev.source}\n${curr.source}`,
        imports: [...(prev.imports || []), ...(curr.imports || [])],
        exports: [...(prev.exports || []), ...(curr.exports || [])],
      }
    } else {
      acc.push(curr)
    }

    return acc
  }, [] as File[])
}

export function getFileSource(file: File) {
  let { source } = file

  // TODO make generic check
  if (!file.fileName.endsWith('.ts')) {
    return file.source
  }
  const imports: File['imports'] = []
  const exports: File['exports'] = []

  file.imports?.forEach((curr) => {
    const exists = imports.find((imp) => imp.path === curr.path)
    if (!exists) {
      imports.push({
        ...curr,
        name: Array.isArray(curr.name) ? uniq(curr.name) : curr.name,
      })
    }

    if (exists && !Array.isArray(exists.name) && exists.name !== curr.name) {
      imports.push(curr)
    }

    if (exists && Array.isArray(exists.name)) {
      if (Array.isArray(curr.name)) {
        exists.name = uniq([...exists.name, ...curr.name])
      }
    }
  })

  file.exports?.forEach((curr) => {
    const exists = exports.find((imp) => imp.path === curr.path)
    if (!exists) {
      exports.push({
        ...curr,
        name: Array.isArray(curr.name) ? uniq(curr.name) : curr.name,
      })
    }

    if (exists && !Array.isArray(exists.name) && exists.name !== curr.name && exists.asAlias === curr.asAlias) {
      exports.push(curr)
    }

    if (exists && Array.isArray(exists.name)) {
      if (Array.isArray(curr.name)) {
        exists.name = uniq([...exists.name, ...curr.name])
      }
    }
  })

  const importNodes = imports.reduce((prev, curr) => {
    return [...prev, createImportDeclaration({ name: curr.name, path: curr.path, isTypeOnly: curr.isTypeOnly })]
  }, [] as ts.ImportDeclaration[])
  const importSource = print(importNodes)

  const exportNodes = exports.reduce((prev, curr) => {
    return [...prev, createExportDeclaration({ name: curr.name, path: curr.path, asAlias: curr.asAlias })]
  }, [] as ts.ExportDeclaration[])
  const exportSource = print(exportNodes)

  if (importSource) {
    source = `${importSource}\n${source}`
  }

  if (exportSource) {
    source = `${exportSource}\n${source}`
  }

  return source
}

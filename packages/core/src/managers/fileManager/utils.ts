import path from 'node:path'

import { createExportDeclaration, createImportDeclaration, print } from '@kubb/parser'

import isEqual from 'lodash.isequal'
import { orderBy } from 'natural-orderby'

import { TreeNode } from '../../utils/index.ts'

import type { TreeNodeOptions } from '../../utils/index.ts'
import type { KubbFile } from './types.ts'

type TreeNodeData = { type: KubbFile.Mode; path: KubbFile.Path; name: string }

export type IndexesOptions = {
  treeNode?: TreeNodeOptions
  isTypeOnly?: boolean
  filter?: (file: KubbFile.File) => boolean
  map?: (file: KubbFile.File) => KubbFile.File
  includeExt?: boolean
  output?: string
}

export function getIndexes(
  root: string,
  extName?: KubbFile.Extname,
  { treeNode = {}, isTypeOnly, filter, map, output, includeExt }: IndexesOptions = {},
): Array<KubbFile.File> | null {
  const extMapper: Record<KubbFile.Extname, TreeNodeOptions> = {
    '.ts': {
      extensions: /\.ts/,
      exclude: [/schemas/, /json/],
    },
    '.json': {
      extensions: /\.json/,
      exclude: [],
    },
  }
  const tree = TreeNode.build<TreeNodeData>(root, { ...(extMapper[extName as keyof typeof extMapper] || {}), ...treeNode })

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

export function combineFiles(files: Array<KubbFile.File | null>): Array<KubbFile.File> {
  return files.filter(Boolean).reduce((acc, curr: KubbFile.File) => {
    const prevIndex = acc.findIndex((item) => item.path === curr.path)

    if (prevIndex !== -1) {
      const prev = acc[prevIndex]

      if (prev) {
        acc[prevIndex] = {
          ...curr,
          source: prev.source && curr.source ? `${prev.source}\n${curr.source}` : '',
          imports: [...(prev.imports || []), ...(curr.imports || [])],
          exports: [...(prev.exports || []), ...(curr.exports || [])],
          env: { ...(prev.env || {}), ...(curr.env || {}) },
        }
      }
    } else {
      acc.push(curr)
    }

    return acc
  }, [] as Array<KubbFile.File>)
}
/**
 * Support for js, ts and tsx(React)
 */

export const extensions: Array<KubbFile.Extname> = ['.js', '.ts', '.tsx']

export function isExtensionAllowed(baseName: string): boolean {
  return extensions.some((extension) => baseName.endsWith(extension))
}

export function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
  const combinedExports = orderBy(exports, [(v) => !v.isTypeOnly], ['asc']).reduce((prev, curr) => {
    const name = curr.name
    const prevByPath = prev.findLast((imp) => imp.path === curr.path)
    const prevByPathAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly)

    if (prevByPathAndIsTypeOnly) {
      // we already have an export that has the same path but uses `isTypeOnly` (export type ...)
      return prev
    }

    const uniquePrev = prev.findLast(
      (imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly && imp.asAlias === curr.asAlias,
    )

    if (uniquePrev || (Array.isArray(name) && !name.length) || (prevByPath?.asAlias && !curr.asAlias)) {
      return prev
    }

    if (!prevByPath) {
      return [
        ...prev,
        {
          ...curr,
          name: Array.isArray(name) ? [...new Set(name)] : name,
        },
      ]
    }

    if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(curr.name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
      prevByPath.name = [...new Set([...prevByPath.name, ...curr.name])]

      return prev
    }

    return [...prev, curr]
  }, [] as Array<KubbFile.Export>)

  return orderBy(combinedExports, [(v) => !v.isTypeOnly, (v) => v.asAlias], ['desc', 'desc'])
}

export function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
  const combinedImports = orderBy(imports, [(v) => !v.isTypeOnly], ['asc']).reduce((prev, curr) => {
    let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

    const hasImportInSource = (importName: string) => {
      if (!source) {
        return true
      }

      const checker = (name?: string) => name && !!source.includes(name)
      return checker(importName) || exports.some(({ name }) => (Array.isArray(name) ? name.some(checker) : checker(name)))
    }

    if (Array.isArray(name)) {
      name = name.filter((item) => hasImportInSource(item))
    }

    const prevByPath = prev.findLast((imp) => imp.path === curr.path && imp.isTypeOnly === curr.isTypeOnly)
    const uniquePrev = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly)
    const prevByPathNameAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly)

    if (prevByPathNameAndIsTypeOnly) {
      // we already have an export that has the same path but uses `isTypeOnly` (import type ...)
      return prev
    }

    if (uniquePrev || (Array.isArray(name) && !name.length)) {
      return prev
    }

    if (!prevByPath) {
      return [
        ...prev,
        {
          ...curr,
          name,
        },
      ]
    }

    if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
      prevByPath.name = [...new Set([...prevByPath.name, ...name])]

      return prev
    }

    if (!Array.isArray(name) && name && !hasImportInSource(name)) {
      return prev
    }

    return [...prev, curr]
  }, [] as Array<KubbFile.Import>)

  return orderBy(combinedImports, [(v) => !v.isTypeOnly], ['desc'])
}

export function createFileSource(file: KubbFile.File): string {
  if (!isExtensionAllowed(file.baseName)) {
    return file.source
  }

  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports ? combineImports(file.imports, exports, file.source) : []

  const importNodes = imports.map((item) => createImportDeclaration({ name: item.name, path: item.path, isTypeOnly: item.isTypeOnly }))
  const exportNodes = exports.map((item) => createExportDeclaration({ name: item.name, path: item.path, isTypeOnly: item.isTypeOnly, asAlias: item.asAlias }))

  return [print([...importNodes, ...exportNodes]), getEnvSource(file.source, file.env)].join('\n')
}

type SearchAndReplaceOptions = {
  text: string
  replaceBy: string
  prefix?: string
  key: string
  searchValues?: (prefix: string, key: string) => Array<RegExp | string>
}

function searchAndReplace(options: SearchAndReplaceOptions): string {
  const { text, replaceBy, prefix = '', key } = options

  const searchValues = options.searchValues?.(prefix, key) || [
    `${prefix}["${key}"]`,
    `${prefix}['${key}']`,
    `${prefix}[\`${key}\`]`,
    `${prefix}"${key}"`,
    `${prefix}'${key}'`,
    `${prefix}\`${key}\``,
    new RegExp(`${prefix}${key}`, 'g'),
  ]

  return searchValues.reduce((prev, searchValue) => {
    return prev.toString().replaceAll(searchValue, replaceBy)
  }, text) as string
}

function getEnvSource(source: string, env: NodeJS.ProcessEnv | undefined): string {
  if (!env) {
    return source
  }

  const keys = Object.keys(env)

  if (!keys.length) {
    return source
  }

  return keys.reduce((prev, key: string) => {
    const environmentValue = env[key]
    const replaceBy = environmentValue ? `'${environmentValue.replaceAll('"', '')?.replaceAll("'", '')}'` : 'undefined'

    if (key.toUpperCase() !== key) {
      throw new TypeError(`Environment should be in upperCase for ${key}`)
    }

    if (typeof replaceBy === 'string') {
      prev = searchAndReplace({ text: prev.replaceAll(`process.env.${key}`, replaceBy), replaceBy, prefix: 'process.env', key })
      // removes `declare const ...`
      prev = searchAndReplace({ text: prev.replaceAll(new RegExp(`(declare const).*\n`, 'ig'), ''), replaceBy, key })
    }

    return prev
  }, source)
}

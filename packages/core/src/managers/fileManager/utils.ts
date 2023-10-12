import pathParser from 'node:path'

import { createExportDeclaration, createImportDeclaration, print } from '@kubb/parser'

import isEqual from 'lodash.isequal'

import { TreeNode } from '../../utils/index.ts'

import type { Path } from '../../types.ts'
import type { PathMode, TreeNodeOptions } from '../../utils/index.ts'
import type { Export, File, Import } from './types.ts'

type TreeNodeData = { type: PathMode; path: Path; name: string }

export function getIndexes(root: string, options: TreeNodeOptions = {}): File[] | null {
  const tree = TreeNode.build<TreeNodeData>(root, { extensions: /\.ts/, ...options })

  if (!tree) {
    return null
  }

  const fileReducer = (files: File[], currentTree: typeof tree) => {
    if (!currentTree.children) {
      return []
    }

    if (currentTree.children?.length > 1) {
      const path = pathParser.resolve(currentTree.data.path, 'index.ts')
      const exports = currentTree.children
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
        .filter(Boolean)

      files.push({
        path,
        fileName: 'index.ts',
        source: '',
        exports,
      })
    } else {
      currentTree.children?.forEach((child) => {
        const path = pathParser.resolve(currentTree.data.path, 'index.ts')
        const importPath = child.data.type === 'directory' ? `./${child.data.name}` : `./${child.data.name.replace(/\.[^.]*$/, '')}`

        files.push({
          path,
          fileName: 'index.ts',
          source: '',
          exports: [{ path: importPath }],
        })
      })
    }

    currentTree.children.forEach((childItem) => {
      fileReducer(files, childItem)
    })

    return files
  }

  const files = fileReducer([], tree)

  return files
}

export function combineFiles(files: Array<File | null>): File[] {
  return files.filter(Boolean).reduce((acc, curr: File) => {
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
  }, [] as File[])
}
/**
 * Support for js, ts and tsx(React)
 */
export type Extension = '.ts' | '.js' | '.tsx'
export const extensions: Array<Extension> = ['.js', '.ts', '.tsx']

export function isExtensionAllowed(fileName: string): boolean {
  return extensions.some((extension) => fileName.endsWith(extension))
}

export function combineExports(exports: Export[]): Export[] {
  return exports.reduce((prev, curr) => {
    const name = curr.name
    const prevByPath = prev.findLast((imp) => imp.path === curr.path)
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
  }, [] as Export[])
}

export function combineImports(imports: Import[], exports: Export[], source: string): Import[] {
  return imports.reduce((prev, curr) => {
    let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

    const hasImportInSource = (importName: string) => {
      const checker = (name?: string) => name && !!source.includes(`${name}`)
      return checker(importName) || exports.some(({ name }) => (Array.isArray(name) ? name.some(checker) : checker(name)))
    }

    if (Array.isArray(name)) {
      name = name.filter((item) => hasImportInSource(item))
    }

    const prevByPath = prev.findLast((imp) => imp.path === curr.path && imp.isTypeOnly === curr.isTypeOnly)
    const uniquePrev = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly)

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
  }, [] as Import[])
}

export function createFileSource(file: File): string {
  let { source } = file

  if (!isExtensionAllowed(file.fileName)) {
    return file.source
  }

  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports ? combineImports(file.imports, exports, source) : []

  const importNodes = imports.map((item) => createImportDeclaration({ name: item.name, path: item.path, isTypeOnly: item.isTypeOnly }))
  const importSource = print(importNodes)

  const exportNodes = exports.map((item) => createExportDeclaration({ name: item.name, path: item.path, isTypeOnly: item.isTypeOnly, asAlias: item.asAlias }))
  const exportSource = print(exportNodes)

  // need to after `combineImports`
  source = getEnvSource(file.source, file.env)

  if (importSource) {
    source = `${importSource}\n${source}`
  }

  if (exportSource) {
    source = `${exportSource}\n${source}`
  }

  return source
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

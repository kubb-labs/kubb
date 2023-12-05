import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'

import isEqual from 'lodash.isequal'
import { orderBy } from 'natural-orderby'
import { z } from 'zod'

import { getRelativePath } from '../fs/read.ts'
import { searchAndReplace } from '../transformers/searchAndReplace.ts'
import { trimExtName } from '../transformers/trim.ts'
import { fileSchema } from './schemas.ts'

import type { KubbFile } from '../FileManager.ts'

function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
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
      name = name.filter((item) => typeof item === 'string' ? hasImportInSource(item) : hasImportInSource(item.propertyName))
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

function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
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

function getSource<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase>(file: KubbFile.File<TMeta>): string {
  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports ? combineImports(file.imports, exports, file.source) : []

  const importNodes = imports.filter(item => {
    // isImportNotNeeded
    // trim extName
    return item.path !== trimExtName(file.path)
  }).map((item) => {
    return factory.createImportDeclaration({
      name: item.name,
      path: item.root ? getRelativePath(item.root, item.path) : item.path,
      isTypeOnly: item.isTypeOnly,
    })
  })
  const exportNodes = exports.map((item) =>
    factory.createExportDeclaration({
      name: item.name,
      path: item.path,
      isTypeOnly: item.isTypeOnly,
      asAlias: item.asAlias,
    })
  )

  return [print([...importNodes, ...exportNodes]), getEnvSource(file.source, file.env)].join('\n')
}

export const optionsSchema = z.object({
  file: fileSchema,
})

export default (options: z.infer<typeof optionsSchema>): string => {
  try {
    const result = optionsSchema.parse(options)

    return getSource(result.file)
  } catch (e) {
    console.log(e)
    return ''
  }
}

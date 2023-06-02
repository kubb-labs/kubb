import uniq from 'lodash.uniq'

import { Generator } from '@kubb/core'

import type { FileResolver } from '../builders/OasBuilder'

/**
 * `propertyName` is the ref name + resolved with the nameResolver
 *
 * `originalName` is the original name used(in PascalCase)
 *
 * `name` is used to make the type more unique when multiple same names are used(see `createImportDeclaration` in `@kubb/ts-codegen`)
 */

export type Ref = { propertyName: string; originalName: string; name?: string }
export type Refs = Record<string, Ref>

export type Import = { refs: Refs; name: string }

export type ImportMeta = {
  ref: Ref
  path: string
}

type Options = {
  fileResolver?: FileResolver
}
export class ImportsGenerator extends Generator<Options> {
  async build(imports: Import[]): Promise<Array<ImportMeta> | undefined> {
    const refs = imports.reduce((acc, currentValue) => {
      return {
        ...acc,
        ...currentValue.refs,
      }
    }, {} as Refs)

    if (Object.keys(refs).length === 0) {
      return undefined
    }

    // add imports based on $ref
    const importPromises = uniq(Object.keys(refs)).map(async ($ref: string) => {
      const { propertyName, originalName, name } = refs[$ref]

      const exists = imports.some((item) => item.name.toLowerCase() === originalName.toLowerCase())

      if (exists && !name) {
        return undefined
      }

      const path = this.options.fileResolver?.(propertyName) || `./${propertyName}`

      // TODO weird hacky fix
      if (path === './' || path === '.') {
        return undefined
      }

      return {
        ref: refs[$ref],
        path: path.replace('./../', '../'),
      }
    })

    const importMeta = await Promise.all(importPromises)

    return importMeta.filter(Boolean) as ImportMeta[]
  }
}

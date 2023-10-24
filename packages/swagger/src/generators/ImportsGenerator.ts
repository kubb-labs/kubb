import { Generator } from '@kubb/core'

import type { KubbPlugin } from '@kubb/core'
import type { FileResolver } from '../builders/OasBuilder.ts'

/**
 * `propertyName` is the ref name + resolved with the nameResolver
 *  @example `import { Pet } from './Pet'`
 *
 * `originalName` is the original name used(in PascalCase), only used to remove duplicates
 *
 * `pluginKey` can be used to override the current plugin being used, handy when you want to import a type/schema out of another plugin
 * @example import a type(swagger-ts) for a mock file(swagger-faker)
 */

export type Ref = { propertyName: string; originalName: string; pluginKey?: KubbPlugin['key'] }
export type Refs = Record<string, Ref>

type Import = { refs: Refs; name: string }

export type ImportMeta = {
  ref: Ref
  path: string
}

type Options = {
  fileResolver?: FileResolver
}
export class ImportsGenerator extends Generator<Options> {
  public items: ImportMeta[] = []

  add(item: ImportMeta | ImportMeta[] | undefined): ImportsGenerator {
    if (!item) {
      return this
    }

    if (Array.isArray(item)) {
      item.forEach((it) => this.items.push(it))
      return this
    }
    this.items.push(item)

    return this
  }

  build(imports: Import[]): ImportMeta[] {
    const refs = imports.reduce((acc, currentValue) => {
      return {
        ...acc,
        ...currentValue.refs,
      }
    }, {} as Refs)

    if (Object.keys(refs).length === 0) {
      return this.items
    }

    // add imports based on $ref
    const importMeta = [...new Set(Object.keys(refs))]
      .map(($ref: string) => {
        const ref = refs[$ref]!
        const { propertyName, originalName } = ref

        const exists = imports.some((item) => item.name.toLowerCase() === originalName.toLowerCase())

        if (exists) {
          return undefined
        }

        const path = this.options.fileResolver?.(propertyName, ref) || `./${propertyName}`

        // TODO weird hacky fix
        if (path === './' || path === '.') {
          return undefined
        }

        return {
          ref: refs[$ref],
          path: path.replace('./../', '../'),
        } as ImportMeta
      })
      .filter(Boolean)

    return [...importMeta, ...this.items]
  }
}

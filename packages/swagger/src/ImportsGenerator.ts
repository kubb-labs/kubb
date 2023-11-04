import { Generator } from '@kubb/core'

import type { FileResolver } from './OasBuilder.ts'
import type { Ref, Refs } from './types.ts'

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

        // do not add import if ref is already in the same file
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

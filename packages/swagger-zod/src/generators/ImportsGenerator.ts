import uniq from 'lodash.uniq'

import { Generator } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger'
import { createImportDeclaration } from '@kubb/ts-codegen'

import type { Refs } from './ZodGenerator'
import type ts from 'typescript'

type Options = {
  fileResolver?: FileResolver
}
export class ImportsGenerator extends Generator<Options> {
  async build(items: Array<{ refs: Refs; sources: string[]; name: string }>): Promise<Array<ts.ImportDeclaration> | undefined> {
    const refs = items.reduce((acc, currentValue) => {
      return {
        ...acc,
        ...currentValue.refs,
      }
    }, {} as Refs)

    if (Object.keys(refs).length === 0) {
      return undefined
    }

    // add imports based on $ref
    const importPromises = uniq(Object.keys(refs))
      .filter(($ref: string) => {
        // when using a $ref inside a type we should not repeat that import
        const { key } = refs[$ref]

        return !items.find((item) => item.name.toLowerCase() === key.toLowerCase())
      })
      .map(async ($ref: string) => {
        const { name } = refs[$ref]

        const path = this.options.fileResolver?.(name) || `./${name}`

        // TODO weird hacky fix
        if (path === './' || path === '.') {
          return undefined
        }

        return createImportDeclaration({
          name: [name],
          path: path.replace('./../', '../'),
          asType: false,
        })
      })

    const nodes = await Promise.all(importPromises)

    return nodes.filter(Boolean) as ts.ImportDeclaration[]
  }
}

import uniq from 'lodash.uniq'

import { Generator } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger'
import { createImportDeclaration } from '@kubb/ts-codegen'

import type { Refs } from './TypeGenerator'
import type ts from 'typescript'

type Options = {
  fileResolver?: FileResolver
}
export class ImportsGenerator extends Generator<Options> {
  async build(items: Array<{ refs: Refs; sources: ts.Node[]; name: string }>): Promise<Array<ts.ImportDeclaration> | undefined> {
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
    const importPromises = uniq(Object.keys(refs)).map(async ($ref: string) => {
      const { key, name, as } = refs[$ref]

      const exists = items.some((item) =>
        item.sources.find((node: ts.Node) => (node as ts.TypeAliasDeclaration).name?.escapedText.toString().toLowerCase() === key.toLowerCase())
      )

      if (exists && !as) {
        return undefined
      }

      const path = this.options.fileResolver?.(name) || `./${name}`

      // TODO weird hacky fix
      if (path === './' || path === '.') {
        return undefined
      }

      return createImportDeclaration({
        name: [{ propertyName: name, name: as }],
        path: path.replace('./../', '../'),
        isTypeOnly: true,
      })
    })

    const nodes = await Promise.all(importPromises)

    return nodes.filter(Boolean) as ts.ImportDeclaration[]
  }
}

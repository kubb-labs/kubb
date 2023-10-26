/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { transformers } from '@kubb/core/utils'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { ImportsGenerator, OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { TypeGenerator } from '../generators/TypeGenerator.ts'

import type { PluginContext } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger'

type Options = {
  usedEnumNames: Record<string, number>

  resolveName: PluginContext['resolveName']
  fileResolver?: FileResolver
  withJSDocs?: boolean
  withImports?: boolean
  enumType: 'enum' | 'asConst' | 'asPascalConst'
  dateType: 'string' | 'date'
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
}

export class TypeBuilder extends OasBuilder<Options, never> {
  configure(options?: Options) {
    if (options) {
      this.options = options
    }

    if (this.options.fileResolver) {
      this.options.withImports = true
    }

    return this
  }

  print(name?: string): string {
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(transformers.nameSorter)
      .map((operationSchema) => {
        const generator = new TypeGenerator({
          usedEnumNames: this.options.usedEnumNames,
          withJSDocs: this.options.withJSDocs,
          resolveName: this.options.resolveName,
          enumType: this.options.enumType,
          dateType: this.options.dateType,
          optionalType: this.options.optionalType,
        })
        const sources = generator.build({
          schema: operationSchema.schema,
          baseName: operationSchema.name,
          description: operationSchema.description,
          keysToOmit: operationSchema.keysToOmit,
        })

        return {
          import: {
            refs: generator.refs,
            name: operationSchema.name,
          },
          sources,
        }
      })
      .sort(refsSorter)

    generated.forEach((item) => {
      codes.push(print(item.sources))
    })

    if (this.options.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.options.fileResolver })
      const importMeta = importsGenerator.build(generated.map((item) => item.import))

      if (importMeta) {
        const nodes = importMeta.map((item) => {
          return factory.createImportDeclaration({
            name: [{ propertyName: item.ref.propertyName }],
            path: item.path,
            isTypeOnly: true,
          })
        })

        codes.unshift(print(nodes))
      }
    }

    return transformers.combineCodes(codes)
  }
}

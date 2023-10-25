import { nameSorter, transformers } from '@kubb/core'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { ImportsGenerator, OasBuilder, refsSorter } from '@kubb/swagger'

import { ZodGenerator } from '../generators/index.ts'

import type { PluginContext } from '@kubb/core'
import type { FileResolver } from '@kubb/swagger'

type Options = {
  fileResolver?: FileResolver
  resolveName: PluginContext['resolveName']
  withJSDocs?: boolean
  withImports?: boolean
}

export class ZodBuilder extends OasBuilder<Options, never> {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
      .sort(nameSorter)
      .map((operationSchema) => {
        const generator = new ZodGenerator({ withJSDocs: this.options.withJSDocs, resolveName: this.options.resolveName })
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
      codes.push(...item.sources)
    })

    if (this.options.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.options.fileResolver })
      const importMeta = importsGenerator.build(generated.map((item) => item.import))

      if (importMeta) {
        const nodes = importMeta.map((item) => {
          return factory.createImportDeclaration({
            name: [{ propertyName: item.ref.propertyName }],
            path: item.path,
            isTypeOnly: false,
          })
        })

        codes.unshift(print(nodes))
      }
    }

    return transformers.combineCodes(codes)
  }
}

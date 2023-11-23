/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { transformers } from '@kubb/core/utils'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { ImportsGenerator, OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { FakerGenerator } from '../generators/index.ts'

import type { FileResolver } from '@kubb/swagger'
import type { PluginOptions } from '../types.ts'

type Options = PluginOptions['resolvedOptions'] & {
  fileResolver?: FileResolver
}

export class FakerBuilder extends OasBuilder<Options> {
  #withImports = false
  configure() {
    if (this.options.fileResolver) {
      this.#withImports = true
    }

    return this
  }

  print(name?: string): string {
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(transformers.nameSorter)
      .map((operationSchema) => {
        const generator = new FakerGenerator(this.options, this.context)
        const sources = generator.build({
          schema: operationSchema.schema,
          baseName: operationSchema.name,
          description: operationSchema.description,
          operationName: operationSchema.operationName,
        })

        return {
          import: {
            refs: generator.refs,
            name: operationSchema.name,
          },
          imports: generator.imports,
          sources,
        }
      })
      .sort(refsSorter)

    generated.forEach((item) => {
      codes.push(...item.sources)
    })

    if (this.#withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.options.fileResolver })

      importsGenerator.add(generated.flatMap((item) => item.imports))
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

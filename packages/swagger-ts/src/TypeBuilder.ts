import transformers from '@kubb/core/transformers'
import { OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { TypeGenerator } from './TypeGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { ImportMeta } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export class TypeBuilder extends OasBuilder<PluginOptions['resolvedOptions']> {
  build(name?: string): Required<Pick<KubbFile.File, 'imports' | 'source'>> {
    const importMeta: ImportMeta[] = []
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(transformers.nameSorter)
      .map((operationSchema) => {
        const generator = new TypeGenerator(this.options, this.context)
        const required = Array.isArray(operationSchema.schema?.required) ? !!operationSchema.schema.required.length : !!operationSchema.schema?.required

        const sources = generator.build({
          schema: operationSchema.schema,
          baseName: operationSchema.name,
          description: operationSchema.description,
          keysToOmit: operationSchema.keysToOmit,
          operation: operationSchema.operation,
          optional: !required && !!operationSchema.name.includes('Params'),
        })
        importMeta.push(...generator.imports)

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

    const imports: KubbFile.Import[] = importMeta.map((item) => {
      return {
        name: [item.ref.propertyName],
        path: item.path,
        isTypeOnly: item.isTypeOnly,
      }
    })

    return {
      imports,
      source: transformers.combineCodes(codes),
    }
  }
}

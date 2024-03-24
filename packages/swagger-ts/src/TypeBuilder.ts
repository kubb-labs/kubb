import transformers from '@kubb/core/transformers'
import { OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { KubbFile } from '@kubb/core'
import type { ImportMeta } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

/**
 * @deprecated replace with Schema component
 */
export class TypeBuilder extends OasBuilder<PluginOptions['resolvedOptions']> {
  /**
   * @deprecated replace with Schema component
   */
  build(name?: string): Required<Pick<KubbFile.File, 'imports' | 'source'>> {
    const importMeta: ImportMeta[] = []
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(transformers.nameSorter)
      .map((operationSchema) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const generator = new SchemaGenerator(this.options, this.context as any)

        const sources = generator.buildSchema(operationSchema.name, operationSchema.schema, operationSchema)
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
        isTypeOnly: true,
      }
    })

    return {
      imports,
      source: transformers.combineCodes(codes),
    }
  }
}

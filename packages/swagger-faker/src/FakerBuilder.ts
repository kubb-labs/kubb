import transformers from '@kubb/core/transformers'
import { OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { FakerGenerator } from './FakerGenerator.ts'

import type { KubbFile } from '@kubb/core'
import type { ImportMeta } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export class FakerBuilder extends OasBuilder<PluginOptions['resolvedOptions']> {
  build(name?: string): Required<Pick<KubbFile.File, 'imports' | 'source'>> {
    const importMeta: ImportMeta[] = []
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(transformers.nameSorter)
      .map((operationSchema) => {
        const generator = new FakerGenerator(this.options, this.context)
        const sources = generator.build(operationSchema)

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

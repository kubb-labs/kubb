import { transformers } from '@kubb/core/utils'
import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'
import { ImportsGenerator, OasBuilder } from '@kubb/swagger'
import { refsSorter } from '@kubb/swagger/utils'

import { FakerGenerator } from './FakerGenerator.ts'

import type { FileResolver } from '@kubb/swagger'
import type { KubbFile } from 'packages/core/dist/index'
import type { PluginOptions } from './types.ts'

type Options = PluginOptions['resolvedOptions'] & {
  fileResolver?: FileResolver
}

export class FakerBuilder extends OasBuilder<Options> {
  build(name?: string): Pick<KubbFile.File, 'imports' | 'source'> {
    const importsGenerator = new ImportsGenerator({ fileResolver: this.options.fileResolver })
    const codes: string[] = []
    let imports: KubbFile.Import[] = []

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

        importsGenerator.add(generator.imports)

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

    if (importsGenerator.options.fileResolver) {
      const importMeta = importsGenerator.build(generated.map((item) => item.import))
      imports = importMeta.map((item) => {
        return {
          name: [item.ref.propertyName],
          path: item.path,
          isTypeOnly: false,
        }
      })
    }

    return {
      imports,
      source: transformers.combineCodes(codes),
    }
  }
  print(name?: string): string {
    const { source, imports = [] } = this.build(name)

    return [
      print(imports.map(item => factory.createImportDeclaration(item))),
      source,
    ].join('')
  }
}

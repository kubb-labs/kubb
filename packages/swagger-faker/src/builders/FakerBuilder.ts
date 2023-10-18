/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { combineCodes, nameSorter } from '@kubb/core'
import { createImportDeclaration, print } from '@kubb/parser'
import { ImportsGenerator, OasBuilder } from '@kubb/swagger'

import { FakerGenerator } from '../generators/index.ts'

import type { PluginContext } from '@kubb/core'
import type { FileResolver, ImportMeta, Refs } from '@kubb/swagger'

type Generated = { import: { refs: Refs; name: string }; sources: string[]; imports?: ImportMeta[] }

type Options = {
  fileResolver?: FileResolver
  resolveName: PluginContext['resolveName']
  withJSDocs?: boolean
  withImports?: boolean
  dateType: 'string' | 'date'
}

// TODO create another function that sort based on the refs(first the ones without refs)
function refsSorter(a: Generated, b: Generated) {
  if (Object.keys(a.import.refs)?.length < Object.keys(b.import.refs)?.length) {
    return -1
  }
  if (Object.keys(a.import.refs)?.length > Object.keys(b.import.refs)?.length) {
    return 1
  }
  return 0
}

export class FakerBuilder extends OasBuilder<Options, never> {
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
        const generator = new FakerGenerator({
          withJSDocs: this.options.withJSDocs,
          resolveName: this.options.resolveName,
          fileResolver: this.options.fileResolver,
          dateType: this.options.dateType,
        })
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

    if (this.options.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.options.fileResolver })

      importsGenerator.add(generated.flatMap((item) => item.imports))
      const importMeta = importsGenerator.build(generated.map((item) => item.import))

      if (importMeta) {
        const nodes = importMeta.map((item) => {
          return createImportDeclaration({
            name: [{ propertyName: item.ref.propertyName }],
            path: item.path,
            isTypeOnly: false,
          })
        })

        codes.unshift(print(nodes))
      }
    }

    return combineCodes(codes)
  }
}

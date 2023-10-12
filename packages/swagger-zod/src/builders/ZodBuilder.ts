import { combineCodes, nameSorter } from '@kubb/core'
import { createImportDeclaration, print } from '@kubb/parser'
import { ImportsGenerator, OasBuilder } from '@kubb/swagger'

import { ZodGenerator } from '../generators/index.ts'

import type { PluginContext } from '@kubb/core'
import type { FileResolver, Refs } from '@kubb/swagger'

type Generated = { import: { refs: Refs; name: string }; sources: string[] }

type Config = {
  fileResolver?: FileResolver
  resolveName: PluginContext['resolveName']
  withJSDocs?: boolean
  withImports?: boolean
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

export class ZodBuilder extends OasBuilder<Config> {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  configure(config: Config) {
    this.config = config

    if (this.config.fileResolver) {
      this.config.withImports = true
    }

    return this
  }

  print(name?: string): string {
    const codes: string[] = []

    const generated = this.items
      .filter((operationSchema) => (name ? operationSchema.name === name : true))
      .sort(nameSorter)
      .map((operationSchema) => {
        const generator = new ZodGenerator({ withJSDocs: this.config.withJSDocs, resolveName: this.config.resolveName })
        const sources = generator.build({ schema: operationSchema.schema, baseName: operationSchema.name, description: operationSchema.description })
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

    if (this.config.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.config.fileResolver })
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

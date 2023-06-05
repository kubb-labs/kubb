import type { FileResolver, Refs } from '@kubb/swagger'
import { OasBuilder, ImportsGenerator } from '@kubb/swagger'
import type { PluginContext } from '@kubb/core'
import { nameSorter } from '@kubb/core'
import { createImportDeclaration, print } from '@kubb/ts-codegen'

import { FakerGenerator } from '../generators/index.ts'

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

export class FakerBuilder extends OasBuilder<Config> {
  configure(config: Config) {
    this.config = config

    if (this.config.fileResolver) {
      this.config.withImports = true
    }

    return this
  }

  async print(name?: string) {
    const codes: string[] = []

    const generated = this.items
      .filter((gen) => (name ? gen.name === name : true))
      .sort(nameSorter)
      .map((gen) => {
        const generator = new FakerGenerator(this.oas, { withJSDocs: this.config.withJSDocs, resolveName: this.config.resolveName })
        const sources = generator.build(gen.schema, gen.name, gen.description)
        return {
          import: {
            refs: generator.refs,
            name: gen.name,
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
      const importMeta = await importsGenerator.build(generated.map((item) => item.import))

      if (importMeta) {
        const nodes = importMeta.map((item) => {
          return createImportDeclaration({
            name: [{ propertyName: item.ref.propertyName, name: item.ref.name }],
            path: item.path,
            isTypeOnly: false,
          })
        })

        codes.unshift(print(nodes))
      }
    }

    return codes.join('\n')
  }
}

import { OasBuilder } from '@kubb/swagger'
import type { FileResolver } from '@kubb/swagger'
import type { PluginContext } from '@kubb/core'
import { nameSorter } from '@kubb/core'
import { print } from '@kubb/ts-codegen'

import { ImportsGenerator, ZodGenerator } from '../generators'
import { pluginName } from '../plugin'

import type { Refs } from '../generators'

type Generated = { refs: Refs; name: string; sources: string[] }

type Config = {
  fileResolver?: FileResolver
  resolveName: PluginContext['resolveName']
  withJSDocs?: boolean
  withImports?: boolean
}

// TODO create another function that sort based on the refs(first the ones without refs)
function refsSorter(a: Generated, b: Generated) {
  if (Object.keys(a.refs)?.length < Object.keys(b.refs)?.length) {
    return -1
  }
  if (Object.keys(a.refs)?.length > Object.keys(b.refs)?.length) {
    return 1
  }
  return 0
}

export class ZodBuilder extends OasBuilder<Config> {
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
        const generator = new ZodGenerator(this.oas, { withJSDocs: this.config.withJSDocs, resolveName: this.config.resolveName })
        const sources = generator.build(gen.schema, this.config.resolveName({ name: gen.name, pluginName }) || gen.name, gen.description)
        return {
          refs: generator.refs,
          name: gen.name,
          sources,
        }
      })
      .sort(refsSorter)

    generated.forEach((item) => {
      codes.push(...item.sources)
    })

    if (this.config.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.config.fileResolver })
      const codeImports = await importsGenerator.build(generated)

      if (codeImports) {
        codes.unshift(print(codeImports))
      }
    }

    return codes.join('\n')
  }
}

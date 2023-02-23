import { OasBuilder } from '@kubb/swagger'
import type { FileResolver } from '@kubb/swagger'
import { nameSorter } from '@kubb/core'
import { print } from '@kubb/ts-codegen'

import { ImportsGenerator, ZodGenerator } from '../generators'

import type { Refs } from '../generators'

type Generated = { refs: Refs; name: string; type: string }

type Config = {
  fileResolver?: FileResolver
  nameResolver?: (name: string) => string
  withJSDocs?: boolean
  withImports?: boolean
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

    // TODO create another function that sort based on the refs(first the ones without refs)
    const refsSorter = (a: Generated, b: Generated) => {
      if (Object.keys(a.refs)?.length < Object.keys(b.refs)?.length) {
        return -1
      }
      if (Object.keys(a.refs)?.length > Object.keys(b.refs)?.length) {
        return 1
      }
      return 0
    }

    const generated = this.items
      .filter((gen) => (name ? gen.name === name : true))
      .sort(nameSorter)
      .map(({ schema, name, description }) => {
        const generator = new ZodGenerator(this.oas, { withJSDocs: this.config.withJSDocs, nameResolver: this.config.nameResolver })
        const type = generator.build(schema, this.config.nameResolver?.(name) || name, description)
        return {
          refs: generator.refs,
          name,
          type,
        }
      })
      .sort(refsSorter)

    generated.forEach((item) => {
      codes.push(item.type)
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

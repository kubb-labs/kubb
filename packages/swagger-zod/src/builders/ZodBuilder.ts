import { OasBuilder } from '@kubb/swagger'

import { ImportsGenerator, ZodGenerator } from '../generators'
import { print } from '../utils'

import type { FileResolver, Refs } from '../generators'
import type { OpenAPIV3 } from 'openapi-types'

type Item = { schema: OpenAPIV3.SchemaObject; name: string; description?: string }

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

  async print() {
    const nameSorter = (a: Item, b: Item) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    }

    const refsSorter = (a: { refs: Refs; type: string; name: string }, b: { refs: Refs; type: string; name: string }) => {
      if (Object.keys(a.refs)?.length < Object.keys(b.refs)?.length) {
        return -1
      }
      if (Object.keys(a.refs)?.length > Object.keys(b.refs)?.length) {
        return 1
      }
      return 0
    }
    const generated = this.items
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

    const code = generated.reduce((acc, currentValue) => {
      const formatedType = currentValue.type
      return `${acc}\n${formatedType}`
    }, '')

    if (this.config.withImports) {
      const importsGenerator = new ImportsGenerator({ fileResolver: this.config.fileResolver })
      const codeImports = await importsGenerator.build(generated)

      if (codeImports) {
        const formatedImports = print(codeImports)
        return [formatedImports, code].join('\n')
      }
    }

    return code
  }
}

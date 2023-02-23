import { OasBuilder } from '@kubb/swagger'

import { ImportsGenerator, TypeGenerator } from '../generators'
import { print } from '../utils'

import type { FileResolver } from '../generators'
import type { OpenAPIV3 } from 'openapi-types'

type Item = { schema: OpenAPIV3.SchemaObject; name: string; description?: string }

type Config = {
  fileResolver?: FileResolver
  nameResolver?: (name: string) => string
  withJSDocs?: boolean
  withImports?: boolean
}
export class TypeBuilder extends OasBuilder<Config> {
  configure(config: Config) {
    this.config = config

    if (this.config.fileResolver) {
      this.config.withImports = true
    }

    return this
  }

  async print() {
    const typeSorter = (a: Item, b: Item) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    }
    const generated = this.items.sort(typeSorter).map(({ schema, name, description }) => {
      const generator = new TypeGenerator(this.oas, { withJSDocs: this.config.withJSDocs, nameResolver: this.config.nameResolver })
      const type = generator.build(schema, this.config.nameResolver?.(name) || name, description)

      return {
        refs: generator.refs,
        name,
        type,
      }
    })

    const code = generated.reduce((acc, currentValue) => {
      const formatedType = print(currentValue.type)
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

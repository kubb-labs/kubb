import { ZodGenerator } from '../generators'

import type { FileResolver } from '../generators'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

type Item = { schema: OpenAPIV3.SchemaObject; name: string; description?: string }
export class ZodBuilder {
  private oas: Oas

  private items: Item[] = []

  private withJSDocs: boolean

  private withImport: boolean

  private fileResolver?: FileResolver

  constructor(oas: Oas) {
    this.oas = oas

    return this
  }

  add(item: Item) {
    this.items.push(item)

    return this
  }

  addImports(fileResolver?: FileResolver) {
    this.fileResolver = fileResolver
    this.withImport = true

    return this
  }

  addJSDocs() {
    this.withJSDocs = true

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
      const generator = new ZodGenerator(this.oas, { withJSDocs: this.withJSDocs })
      const type = generator.build(schema, name, description)
      return {
        refs: generator.refs,
        type,
      }
    })

    const code = generated.reduce((acc, currentValue) => {
      const formatedType = currentValue.type
      return `${acc}\n${formatedType}`
    }, '')

    // if (this.withImport) {
    //   const importsGenerator = new ImportsGenerator({ fileResolver: this.fileResolver })
    //   const codeImports = await importsGenerator.build(generated)

    //   if (codeImports) {
    //     const formatedImports = print(codeImports)
    //     return [formatedImports, code].join('\n')
    //   }
    // }

    return code
  }
}

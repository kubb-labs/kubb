import type { OpenAPIV3 } from 'openapi-types'
import type { Oas } from '../types.ts'

export type FileResolver = (name: string) => string | null | undefined

type Item = { schema: OpenAPIV3.SchemaObject; name: string; description?: string }

/**
 * Abstract class that contains the building blocks for creating an type/zod builder
 */
export abstract class OasBuilder<TConfig extends object = object> {
  public oas: Oas

  public items: Item[] = []

  public config: TConfig = {} as TConfig

  constructor(oas: Oas) {
    this.oas = oas

    return this
  }

  add(item: Item | Item[] | undefined) {
    if (!item) {
      return this
    }

    if (Array.isArray(item)) {
      item.forEach((it) => this.items.push(it))
      return this
    }
    this.items.push(item)

    return this
  }

  abstract configure(config: TConfig): this

  abstract print(name?: string): Promise<string>
}

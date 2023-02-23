import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

export type FileResolver = (name: string) => Promise<string | null | undefined>

type Item = { schema: OpenAPIV3.SchemaObject; name: string; description?: string }

/**
 * Abstract class that contains the building blocks for creating an type/zod builder
 */
export abstract class OasBuilder<TConfig extends object = object> {
  public oas: Oas

  public items: Item[] = []

  public config: TConfig = {} as any

  constructor(oas: Oas) {
    this.oas = oas

    return this
  }

  add(item: Item | undefined) {
    if (item) {
      this.items.push(item)
    }

    return this
  }

  abstract configure(config: TConfig): this

  abstract print(name?: string): Promise<string>
}

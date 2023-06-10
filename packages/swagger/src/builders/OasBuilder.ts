import type { Ref } from '../generators/ImportsGenerator.ts'
import type { Oas, OperationSchema } from '../types.ts'

export type FileResolver = (name: string, ref: Ref) => string | null | undefined

/**
 * Abstract class that contains the building blocks for creating an type/zod builder
 */
export abstract class OasBuilder<TConfig extends object = object> {
  public oas: Oas

  public items: OperationSchema[] = []

  public config: TConfig = {} as TConfig

  constructor(oas: Oas) {
    this.oas = oas

    return this
  }

  add(item: OperationSchema | OperationSchema[] | undefined) {
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

  abstract print(name?: string): string
}

import type { PluginFactoryOptions, PluginManager } from '@kubb/core'
import type { KubbPlugin } from '@kubb/core'
import type { Oas, Operation, OperationSchema, OperationSchemas, Ref } from './types.ts'

export type FileResolver = (name: string, ref: Ref) => string | null | undefined

type Context<TPluginOptions extends PluginFactoryOptions> = {
  oas: Oas
  pluginManager: PluginManager
  plugin: KubbPlugin<TPluginOptions>
  operation: Operation
  schemas: OperationSchemas
}

/**
 * Abstract class that contains the building blocks for creating an type/zod builder
 */
export abstract class OasBuilder<TOptions = unknown, TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions, TContext = Context<TPluginOptions>> {
  #options: TOptions = {} as TOptions
  #context: TContext = {} as TContext

  items: OperationSchema[] = []

  constructor(options?: TOptions, context?: TContext) {
    if (context) {
      this.#context = context
    }

    if (options) {
      this.#options = options
    }

    return this
  }

  get options(): TOptions {
    return this.#options
  }

  get context(): TContext {
    return this.#context
  }

  set options(options: TOptions) {
    this.#options = { ...this.#options, ...options }
  }

  add(item: OperationSchema | Array<OperationSchema | undefined> | undefined): this {
    if (!item) {
      return this
    }

    if (Array.isArray(item)) {
      item.filter(Boolean).forEach((it) => this.items.push(it))
      return this
    }
    this.items.push(item)

    return this
  }

  abstract print(...rest: unknown[]): string
}

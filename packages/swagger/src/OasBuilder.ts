import type { PluginManager } from '@kubb/core'
import type { Oas, OperationSchema } from './types.ts'

type Context = {
  oas: Oas
  pluginManager: PluginManager
}

/**
 * Abstract class that contains the building blocks for creating a type/zod builder
 */
export abstract class OasBuilder<TOptions = unknown, TContext = Context> {
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
}

/**
 * Abstract class that contains the building blocks for plugins to create their own Generator
 * @link idea based on https://github.com/colinhacks/zod/blob/master/src/types.ts#L137
 */
export abstract class BaseGenerator<TOptions = unknown, TContext = unknown> {
  #options: TOptions = {} as TOptions
  #context: TContext = {} as TContext

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

  abstract build(...params: unknown[]): unknown
}

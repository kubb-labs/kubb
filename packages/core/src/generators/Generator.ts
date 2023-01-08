/**
 * Abstract class that contains the building blocks for plugins to create their own Generator
 * @link idea based on https://github.com/colinhacks/zod/blob/master/src/types.ts#L137
 */
export abstract class Generator<TOptions extends object = object> {
  private _options: TOptions = {} as TOptions

  constructor(options: TOptions = {} as TOptions) {
    if (options) {
      this._options = {
        ...this._options,
        ...options,
      }
    }
    return this
  }

  get options() {
    return this._options
  }

  abstract build(...params: unknown[]): unknown
}

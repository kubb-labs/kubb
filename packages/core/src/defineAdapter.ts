import type { Adapter, AdapterFactoryOptions } from './types.ts'

type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

/**
 * Wraps an adapter builder to make the options parameter optional.
 *
 * @example
 * ```ts
 * export const adapterOas = defineAdapter<OasAdapter>((options) => {
 *   const { validate = true, dateType = 'string' } = options
 *   return {
 *     name: adapterOasName,
 *     options: { validate, dateType, ... },
 *     parse(source) { ... },
 *   }
 * })
 * ```
 */
export function defineAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(build: AdapterBuilder<T>): (options?: T['options']) => Adapter<T> {
  return (options) => build(options ?? ({} as T['options']))
}

import type { Adapter, AdapterFactoryOptions } from './types.ts'

/**
 * Builder type for an {@link Adapter} — takes options and returns the adapter instance.
 */
type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

/**
 * Creates an adapter factory. Call the returned function with optional options to get the adapter instance.
 *
 * @example
 * export const myAdapter = createAdapter<MyAdapter>((options) => {
 *   return {
 *     name: 'my-adapter',
 *     options,
 *     async parse(source) { ... },
 *   }
 * })
 *
 * // instantiate
 * const adapter = myAdapter({ validate: true })
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(build: AdapterBuilder<T>): (options?: T['options']) => Adapter<T> {
  return (options) => build(options ?? ({} as T['options']))
}

import type { Adapter, AdapterFactoryOptions } from './types.ts'

type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(build: AdapterBuilder<T>): (options?: T['options']) => Adapter<T> {
  return (options) => build(options ?? ({} as T['options']))
}

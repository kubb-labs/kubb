import type { PluginType, ResolverBuildOptions, ResolverFile } from '@kubb/core'
import { Resolver } from './Resolver.ts'

/** The plugin-specific resolver fields handed to `createResolver`. */
type ResolverOptions<T extends PluginType> = Omit<T['resolver'], keyof Resolver> & {
  pluginName: T['name']
  name?: T['resolver']['name']
  file?: ResolverFile
} & ThisType<T['resolver']>

/** Defines a plugin resolver, the object that decides what every generated symbol and file path is called. */
export function createResolver<T extends PluginType>(options: ResolverOptions<T>): T['resolver'] {
  return new Resolver(options as unknown as ResolverBuildOptions) as T['resolver']
}

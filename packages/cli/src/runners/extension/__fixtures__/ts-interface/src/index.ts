import { defineParser, definePlugin } from '@kubb/core'
import type { PluginFactoryOptions } from '@kubb/core'

/**
 * Options of `pluginRoutes`.
 */
export interface RoutesOptions {
  /**
   * Where the route table is written.
   */
  output?: {
    /**
     * File path, relative to the config's `output.path`.
     *
     * @default 'routes.ts'
     */
    path: string
  }
  /**
   * Base path every route starts with.
   *
   * @default '/'
   */
  basePath?: string
  /**
   * How route names are cased.
   *
   * @default 'camelCase'
   */
  casing?: 'camelCase' | 'kebab-case'
  /**
   * HTTP methods to include. Any other string is accepted too.
   *
   * @default ['GET']
   */
  methods?: Array<'GET' | 'POST' | (string & {})>
  /**
   * Adds a `meta` field to each route.
   *
   * @default false
   */
  withMeta?: boolean
  /**
   * Maximum depth of nested routes.
   *
   * @default 3
   * @deprecated Nested routes are always flattened.
   */
  depth?: number
  /**
   * Names each route. See {@link RoutesOptions.casing} for the default.
   *
   * @default `casing`
   * @see {@link https://example.com/docs/name | Naming routes}
   */
  name?: (path: string) => string
}

type PluginRoutes = PluginFactoryOptions<'plugin-routes', RoutesOptions>

export const pluginRoutes = definePlugin<PluginRoutes>({
  meta: { name: 'plugin-routes', category: 'framework', tags: ['routes'] },
  setup: (options) => options,
})

/**
 * Options of `parserRoutes`.
 */
export type ParserRoutesOptions = {
  /**
   * Indent with tabs instead of spaces.
   *
   * @default false
   */
  tabs?: boolean
}

export const parserRoutes = defineParser<ParserRoutesOptions>({
  meta: { name: 'routes' },
  build: () => ({
    extNames: ['.routes'],
    parse: () => '',
    print: () => '',
  }),
})

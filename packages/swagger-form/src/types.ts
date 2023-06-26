import type { PluginFactoryOptions, File } from '@kubb/core'
import type { FormKeyword } from './parsers/index.ts'

export type Options = {
  /**
   * Output to save the @tanstack/query hooks.
   * @default `"hooks"`
   */
  output?: string
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped @tanstack/query hooks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `hooks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Hooks"`
     */
    exportAs?: string
  }
  /**
   * Include `@hookform/devtools`
   * @default `false`
   */
  withDevtools?: boolean
  overrides?: {
    /**
     * Override default formKeywordMapper
     */
    mapper?: Partial<Record<FormKeyword, { template: string; imports?: File['imports'] }>>
    /**
     * Override default form
     */
    form?: { template: string; imports?: File['imports'] }
  }
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-form', Options, false, undefined, ResolvePathOptions>

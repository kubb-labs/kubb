import type { PluginFactoryOptions, Import } from '@kubb/core'
import type { FormKeyword } from './parsers/index.ts'

export type Options = {
  /**
   * Output to save the form.
   * @default `"forms"`
   */
  output?: string
  /**
   * Group the form based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped form.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `forms/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}forms"`
     */
    exportAs?: string
  }
  /**
   * Includes `@hookform/devtools`
   * @default `false`
   */
  withDevtools?: boolean
  /**
   * Override default behaviour of the formParser
   */
  overrides?: {
    /**
     * Override the default fields templates with your own
     * @link https://kubb.dev/examples/data-driven-forms
     * @link https://kubb.dev/examples/react-hook-form
     */
    mapper?: Partial<Record<FormKeyword, { template: string; imports?: Import[] }>>
    /**
     * Override the form templates with your own
     * @link https://kubb.dev/examples/data-driven-forms
     * @link https://kubb.dev/examples/react-hook-form
     */
    form?: { template: string; imports?: Import[] }
  }
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-form', Options, false, undefined, ResolvePathOptions>

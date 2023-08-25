import type { PluginFactoryOptions, Import } from '@kubb/core'
import type { FormKeyword } from './parsers/index.ts'
import type { SkipBy } from '@kubb/swagger'

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
  skipBy?: SkipBy[]
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
     * `{{name}}` will be replaced by the key used in properties of your schema
     * `{{required}}` will be replaced by true if the property is required
     * `{{label}} will be replaced by the name in sentenceCase
     * `{{defaultValue}}` will be replaced by defaultValue set in the schema
     * @link https://kubb.dev/examples/data-driven-forms
     * @link https://kubb.dev/examples/react-hook-form
     */
    mapper?: Partial<Record<FormKeyword, { template: string; imports?: Import[] }>>
    /**
     * Override the form templates with your own
     * `{{name}}` will be replaced by the key used in properties of your schema
     * `{{fields}}` will be replaced by what has been set in the overrides or the default FormKeyword mapper
     * @link https://kubb.dev/examples/react-hook-form
     */
    form?: { template: string; imports?: Import[] }
  }
  transformers?: {
    /**
     * Override the name of the form that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type FileMeta = {
  pluginName?: string
  tag: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-form', Options, false, undefined, ResolvePathOptions>

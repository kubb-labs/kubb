import type { Output, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Output for the generated doc, [https://redocly.com/](https://redocly.com/) is being used for the generation
     * @default 'docs.html'
     */
    path: string
  }
  /**
   * Whether to dereference the OpenAPI document before rendering.
   *
   * When `true`, all `$ref` pointers are resolved and inlined before the HTML
   * page is generated. This produces a fully self-contained document that does
   * not rely on Redoc's own `$ref` resolution.
   *
   * > **Note**: Schemas with circular `$ref`s cannot be fully dereferenced
   * > (they would cause `JSON.stringify` to throw). Enable this option only
   * > when you know your spec has no circular references.
   *
   * @default false
   */
  dereference?: boolean
}

type ResolveOptions = {
  output: Output<never>
  name: string
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions, never>

import type { KubbPlugin, PluginFactoryOptions } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta, OverrideBy, ResolvePathOptions, SkipBy } from '@kubb/swagger'

export type Options = {
  /**
   * Output to save the clients.
   * @default `"clients"``
   */
  output?: string
  /**
   * Group the clients based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped clients.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `clients/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Service"`
     */
    exportAs?: string
  }
  /**
   * Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.
   */
  skipBy?: Array<SkipBy>
  /**
   * Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.
   */
  overrideBy?: Array<OverrideBy<ResolvedOptions>>
  /**
   * Path to the client that will be used to do the API calls.
   * Relative to the root.
   * @default '@kubb/swagger-client/client'
   * @deprecated Use `clientImportPath` instead. It will be skipped if `clientImportPath` is provided.
   */
  client?: string
  /**
   * Path to the client import path that will be used to do the API calls.
   * It will be used as `import client from '${clientImportPath}'`.
   * It allow both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@kubb/swagger-client/client'
   */
  clientImportPath?: string
  /**
   * Experimental
   *
   * ReturnType that needs to be used when calling client().
   *
   * `Data` will return ResponseConfig[data].
   *
   * `Full` will return ResponseConfig.
   * @default `'data'`
   * @private
   */
  dataReturnType?: 'data' | 'full'
  /**
   * Experimental
   *
   * How to pass your pathParams.
   *
   * `object` will return the pathParams as an object.
   *
   * `inline` will return the pathParams as comma separated params.
   * @default `'inline'`
   * @private
   */
  pathParamsType?: 'object' | 'inline'
  transformers?: {
    /**
     * Override the name of the client that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

type ResolvedOptions = {
  clientImportPath?: Options['clientImportPath']
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  client?: Options['client']
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

type AppMeta = SwaggerAppMeta

export type PluginOptions = PluginFactoryOptions<'swagger-client', 'controller', Options, ResolvedOptions, never, ResolvePathOptions, AppMeta>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-client']: PluginOptions
  }
}

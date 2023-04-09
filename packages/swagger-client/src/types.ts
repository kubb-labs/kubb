import type { PluginFactoryOptions } from '@kubb/core'

export interface RequestConfig<TVariables = unknown> {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'

  url: string

  params?: unknown

  data?: TVariables

  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

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
  }
  /**
   * Path to the client that will be used to do the API calls.
   * Relative to the root
   * @default '@kubb/swagger-client/client.ts'
   */
  client?: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<Options, false, undefined, ResolvePathOptions>

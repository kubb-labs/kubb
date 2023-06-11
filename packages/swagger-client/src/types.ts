import { CreateAxiosDefaults } from 'axios'

import type { PluginFactoryOptions } from '@kubb/core'

export type RequestConfig<TVariables = unknown> = {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'

  url: string

  params?: unknown

  data?: TVariables

  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

/**
 * We override `process.env` so no need to import this
 * @example tsconfig.json
"compilerOptions": {
___ "types": ["@kubb/swagger-client/globals"]
}
*/
export type Environments = {
  AXIOS_BASE?: CreateAxiosDefaults['baseURL']
  AXIOS_HEADERS?: CreateAxiosDefaults['headers']
}

/**
 * We override `process.env` so no need to import this
 * @example tsconfig.json
"compilerOptions": {
___ "types": ["@kubb/swagger-client/globals"]
}
*/
export type Environment = keyof Environments

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
   * Path to the client that will be used to do the API calls.
   * Relative to the root
   * @default '@kubb/swagger-client/client.ts'
   */
  client?: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<Options, false, undefined, ResolvePathOptions>

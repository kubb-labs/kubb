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
   * Output to save the ReactQuery hooks.
   * @default hooks/query
   */
  output?: string
  /**
   * Group the react-query hooks based on the provided name.
   * Tag will group based on the operation tag inside the Swagger file
   */
  groupBy?: 'tag'
  /**
   * Path to the client that will be used to do the API calls.
   * Relative to the root
   * @default copy of '@kubb/swagger-react-query/client.ts'
   */
  client?: string
}

export type ResolveIdOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<Options, false, undefined, ResolveIdOptions>

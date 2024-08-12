import transformers from '@kubb/core/transformers'
import type { URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'
import type { PluginSwr } from '../types.ts'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * Parameters/options/props that need to be used
   */
  params: string
  /**
   * Generics that needs to be added for TypeScript
   */
  generics?: string
  /**
   * ReturnType(see async for adding Promise type)
   */
  returnType?: string
  /**
   * Options for JSdocs
   */
  JSDoc?: {
    comments: string[]
  }
  hook: {
    name: string
    generics?: string
  }
  client: {
    method: HttpMethod
    generics: string
    withQueryParams: boolean
    withPathParams: boolean
    withData: boolean
    withHeaders: boolean
    path: URLPath
  }
  dataReturnType: NonNullable<PluginSwr['options']['dataReturnType']>
}

export function Mutation({ name, generics, returnType, params, JSDoc, client, hook, dataReturnType }: Props): ReactNode {
  const clientOptions = [
    `method: "${client.method}"`,
    'url',
    client.withQueryParams ? 'params' : undefined,
    client.withData ? 'data' : undefined,
    client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
    '...clientOptions',
  ].filter(Boolean)

  const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`
  if (client.withQueryParams) {
    return (
      <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
         const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${client.path.template} as const
         return ${hook.name}<${hook.generics}>(
          shouldFetch ? [url, params]: null,
          async (_url${client.withData ? ', { arg: data }' : ''}) => {
            const res = await client<${client.generics}>({
              ${resolvedClientOptions}
            })

            return ${dataReturnType === 'data' ? 'res.data' : 'res'}
          },
          mutationOptions
        )
      `}
      </Function>
    )
  }
  return (
    <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
      {`
       const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${client.path.template} as const
       return ${hook.name}<${hook.generics}>(
        shouldFetch ? url : null,
        async (_url${client.withData ? ', { arg: data }' : ''}) => {
          const res = await client<${client.generics}>({
            ${resolvedClientOptions}
          })

          return ${dataReturnType === 'data' ? 'res.data' : 'res'}
        },
        mutationOptions
      )
    `}
    </Function>
  )
}

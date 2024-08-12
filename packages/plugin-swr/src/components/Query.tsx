import type { URLPath } from '@kubb/core/utils'
import { Function } from '@kubb/react'

import type { ReactNode } from 'react'

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
    queryOptions: string
  }
  client: {
    path: URLPath
    withQueryParams: boolean
  }
}

export function Query({ name, generics, returnType, params, JSDoc, hook, client }: Props): ReactNode {
  if (client.withQueryParams) {
    return (
      <>
        <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
          {`
         const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

         const url = ${client.path.template}
         const query = ${hook.name}<${hook.generics}>(
          shouldFetch ? [url, params]: null,
          {
            ...${hook.queryOptions},
            ...queryOptions
          }
         )

         return query
         `}
        </Function>
      </>
    )
  }

  return (
    <>
      <Function name={name} export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`
       const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

       const url = ${client.path.template}
       const query = ${hook.name}<${hook.generics}>(
        shouldFetch ? url : null,
        {
          ...${hook.queryOptions},
          ...queryOptions
        }
       )

       return query
       `}
      </Function>
    </>
  )
}

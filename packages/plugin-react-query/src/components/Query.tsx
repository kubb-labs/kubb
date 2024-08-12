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
    generics?: string
    queryKey: string
    queryOptions: string
  }
}

export function Query({ name, generics, returnType, params, JSDoc, hook }: Props): ReactNode {
  const resolvedReturnType = `${returnType} & { queryKey: TQueryKey }`

  return (
    <>
      <Function name={name} export generics={generics} returnType={resolvedReturnType} params={params} JSDoc={JSDoc}>
        {`
         const { query: queryOptions, client: clientOptions = {} } = options ?? {}
         const queryKey = queryOptions?.queryKey ?? ${hook.queryKey}

         const query = useQuery({
          ...${hook.queryOptions} as unknown as QueryObserverOptions,
          queryKey,
          ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
        }) as ${resolvedReturnType}

        query.queryKey = queryKey as TQueryKey

        return query

         `}
      </Function>
    </>
  )
}

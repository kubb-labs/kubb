import client from '@kubb/swagger-client/client'
import { useQuery } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../models/FindPetsByStatus'
import type { UseQueryReturnType, QueryKey, WithRequired } from '@tanstack/vue-query'
import type { VueQueryObserverOptions } from '@tanstack/vue-query/build/lib/types'
import type { MaybeRef } from 'vue'

type FindPetsByStatusClient = typeof client<FindPetsByStatusQueryResponse, FindPetsByStatus400, never>
type FindPetsByStatus = {
  data: FindPetsByStatusQueryResponse
  error: FindPetsByStatus400
  request: never
  pathParams: never
  queryParams: FindPetsByStatusQueryParams
  headerParams: never
  response: FindPetsByStatusQueryResponse
  client: {
    parameters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}
export const findPetsByStatusQueryKey = (params?: MaybeRef<FindPetsByStatus['queryParams']>) =>
  [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<TData = FindPetsByStatus['response'], TQueryData = FindPetsByStatus['response']>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: FindPetsByStatus['client']['parameters'] = {},
): WithRequired<VueQueryObserverOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByStatusQueryKey(refParams)
  return {
    queryKey,
    queryFn: async () => {
      const params = unref(refParams)
      const res = await client<FindPetsByStatus['data'], FindPetsByStatus['error']>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatus<
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(
  refParams?: MaybeRef<FindPetsByStatusQueryParams>,
  options: {
    query?: Partial<VueQueryObserverOptions<FindPetsByStatus['response'], FindPetsByStatus['error'], TData, TQueryKey>>
    client?: FindPetsByStatus['client']['parameters']
  } = {},
): UseQueryReturnType<TData, FindPetsByStatus['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(refParams)
  const query = useQuery<FindPetsByStatus['data'], FindPetsByStatus['error'], TData, any>({
    ...findPetsByStatusQueryOptions<TData, TQueryData>(refParams, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryReturnType<TData, FindPetsByStatus['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

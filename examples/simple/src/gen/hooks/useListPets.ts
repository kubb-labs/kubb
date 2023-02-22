import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { ListPetsResponse, ListPetsPathParams, ListPetsQueryParams } from '../models/ListPets'

export const listPetsQueryKey = (pathParams?: ListPetsPathParams, queryParams?: ListPetsQueryParams) =>
  ['/pets', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary List all pets
 * @link /pets
 */
export const useListPets = <TData = ListPetsResponse>(
  pathParams: ListPetsPathParams,
  queryParams: ListPetsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pets').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

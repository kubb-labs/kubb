import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { FindPetsByStatusResponse, FindPetsByStatusPathParams, FindPetsByStatusQueryParams } from '../models/ts/FindPetsByStatus'

export const findPetsByStatusQueryKey = (pathParams?: FindPetsByStatusPathParams, queryParams?: FindPetsByStatusQueryParams) =>
  ['/pet/findByStatus', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export const useFindPetsByStatus = <TData = FindPetsByStatusResponse>(
  pathParams: FindPetsByStatusPathParams,
  queryParams: FindPetsByStatusQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pet/findByStatus').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

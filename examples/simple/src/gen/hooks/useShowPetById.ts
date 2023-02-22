import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { ShowPetByIdResponse, ShowPetByIdPathParams, ShowPetByIdQueryParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (pathParams?: ShowPetByIdPathParams, queryParams?: ShowPetByIdQueryParams) =>
  ['/pets/{petId}', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export const useShowPetById = <TData = ShowPetByIdResponse>(
  pathParams: ShowPetByIdPathParams,
  queryParams: ShowPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pets/{petId}').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions } from '@tanstack/react-query'
import type { GetPetByIdResponse, GetPetByIdPathParams, GetPetByIdQueryParams } from '../models/ts/GetPetById'

export const getPetByIdQueryKey = (pathParams?: GetPetByIdPathParams, queryParams?: GetPetByIdQueryParams) =>
  ['/pet/{petId}', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 */
export const useGetPetById = <TData = GetPetByIdResponse>(
  pathParams: GetPetByIdPathParams,
  queryParams: GetPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pet/{petId}').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

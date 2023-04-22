import useSWR from 'swr'

import client from '@kubb/swagger-client/client'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ListPetsQueryResponse, ListPetsQueryParams } from '../models/ListPets'

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(params?: ListPetsQueryParams): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPets<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: SWRConfiguration<TData, TError> }
): SWRResponse<TData, TError> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, TError, string>(`/pets`, {
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  })

  return query
}

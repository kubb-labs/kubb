import useSWR from 'swr'

import client from '@kubb/swagger-client/client'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ListPetsResponse, ListPetsQueryParams } from '../models/ListPets'

export function listPetsQueryOptions<TData = ListPetsResponse>(params?: ListPetsQueryParams): SWRConfiguration<TData> {
  return {
    fetcher: () => {
      return client<TData>({
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
export function useListPets<TData = ListPetsResponse>(params?: ListPetsQueryParams, options?: { query?: SWRConfiguration<TData> }): SWRResponse<TData> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, unknown, string>(`/pets`, {
    ...listPetsQueryOptions<TData>(params),
    ...queryOptions,
  })

  return query
}

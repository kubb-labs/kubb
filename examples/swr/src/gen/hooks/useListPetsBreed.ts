import useSWR from 'swr'

import client from '@kubb/swagger-client/client'

import type { SWRConfiguration, SWRResponse } from 'swr'
import type { ListPetsBreedResponse, ListPetsBreedPathParams, ListPetsBreedQueryParams } from '../models/ListPetsBreed'

export function listPetsBreedQueryOptions<TData = ListPetsBreedResponse>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams
): SWRConfiguration<TData> {
  return {
    fetcher: () => {
      return client<TData>({
        method: 'get',
        url: `/pets/$${breed}`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets with breed
 * @link /pets/${breed}
 */
export function useListPetsBreed<TData = ListPetsBreedResponse>(
  breed: ListPetsBreedPathParams['breed'],
  params?: ListPetsBreedQueryParams,
  options?: { query?: SWRConfiguration<TData> }
): SWRResponse<TData> {
  const { query: queryOptions } = options ?? {}

  const query = useSWR<TData, unknown, string>(`/pets/$${breed}`, {
    ...listPetsBreedQueryOptions<TData>(breed, params),
    ...queryOptions,
  })

  return query
}

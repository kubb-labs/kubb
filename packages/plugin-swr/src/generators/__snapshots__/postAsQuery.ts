import client from '@kubb/plugin-client/client'
import useSWR from 'custom-swr'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { SWRConfiguration } from 'custom-swr'
import type { Key } from 'swr'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    query?: SWRConfiguration<UpdatePetWithFormMutationResponse, UpdatePetWithForm405>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/pet/${petId}`, params] as const
  return useSWR<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, Key>(shouldFetch ? swrKey : null, {
    ...updatePetWithFormQueryOptions(petId, params, config),
    ...queryOptions,
  })
}

export function updatePetWithFormQueryOptions(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  return {
    fetcher: async () => {
      return updatePetWithForm(petId, params, config)
    },
  }
}

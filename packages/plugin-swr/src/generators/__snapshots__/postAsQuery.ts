import client from '@kubb/plugin-client/clients/axios'
import useSWR from 'custom-swr'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams) =>
  [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : [])] as const

export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    params,
    ...requestConfig,
  })
  return res.data
}

export function updatePetWithFormQueryOptions(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  return {
    fetcher: async () => {
      return updatePetWithForm({ petId, params }, config)
    },
  }
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithForm(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  options: {
    query?: Parameters<typeof useSWR<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormQueryKey | null, any>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = updatePetWithFormQueryKey(petId, params)

  return useSWR<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormQueryKey | null>(shouldFetch ? queryKey : null, {
    ...updatePetWithFormQueryOptions({ petId, params }, config),
    ...queryOptions,
  })
}

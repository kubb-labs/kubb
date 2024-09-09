import client from 'axios'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from 'axios'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: 'post', url: `/pet/${petId}`, params, ...config })
  return res.data
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<UpdatePetWithFormMutationResponse, UpdatePetWithForm405>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/pet/${petId}`, params] as const
  return useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, Key>(
    shouldFetch ? swrKey : null,
    async (_url) => {
      return updatePetWithForm(petId, params, config)
    },
    mutationOptions,
  )
}

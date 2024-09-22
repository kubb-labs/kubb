import client from '@kubb/plugin-client/client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetWithFormMutationResponse,
      UpdatePetWithForm405,
      {
        petId: MaybeRef<UpdatePetWithFormPathParams['petId']>
        params?: MaybeRef<UpdatePetWithFormQueryParams>
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      petId,
      params,
    }: {
      petId: UpdatePetWithFormPathParams['petId']
      params?: UpdatePetWithFormQueryParams
    }) => {
      return updatePetWithForm(petId, params, config)
    },
    ...mutationOptions,
  })
}

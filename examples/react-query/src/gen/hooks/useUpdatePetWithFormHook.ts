import client from '@kubb/plugin-client/client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'post',
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
export function useUpdatePetWithFormHook(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: UseMutationOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      return updatePetWithForm(petId, params, config)
    },
    ...mutationOptions,
  })
}

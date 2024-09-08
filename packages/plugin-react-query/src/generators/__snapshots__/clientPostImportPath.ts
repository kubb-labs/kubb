import client from 'axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import type { RequestConfig } from 'axios'
import { useMutation } from '@tanstack/react-query'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: UseMutationOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      return updatePetWithForm(petId, data, params, config)
    },
    ...mutationOptions,
  })
}

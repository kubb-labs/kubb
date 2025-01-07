import client from 'axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import type { RequestConfig, ResponseErrorConfig } from 'axios'
import { useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{pet_id}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  data?: UpdatePetWithFormMutationRequest,
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationRequest>({
    method: 'POST',
    url: `/pet/${pet_id}`,
    params,
    data,
    ...config,
  })
  return updatePetWithFormMutationResponse.parse(res.data)
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
export function useUpdatePetWithForm(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetWithFormMutationResponse,
      ResponseErrorConfig<UpdatePetWithForm405>,
      { petId: UpdatePetWithFormPathParams['petId']; data?: UpdatePetWithFormMutationRequest; params?: UpdatePetWithFormQueryParams }
    >
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey()

  return useMutation<
    UpdatePetWithFormMutationResponse,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; data?: UpdatePetWithFormMutationRequest; params?: UpdatePetWithFormQueryParams }
  >({
    mutationFn: async ({ petId, data, params }) => {
      return updatePetWithForm(petId, data, params, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

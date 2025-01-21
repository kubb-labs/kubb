import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { RequestConfig, ResponseErrorConfig } from 'axios'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithForm(
  options: {
    mutation?: MutationObserverOptions<
      UpdatePetWithFormMutationResponse,
      ResponseErrorConfig<UpdatePetWithForm405>,
      {
        petId: MaybeRef<UpdatePetWithFormPathParams['petId']>
        data?: MaybeRef<UpdatePetWithFormMutationRequest>
        params?: MaybeRef<UpdatePetWithFormQueryParams>
      }
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

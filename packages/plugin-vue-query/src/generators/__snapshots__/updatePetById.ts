import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  data?: UpdatePetWithFormMutationRequest,
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}`,
    params,
    data,
    ...config,
  })
  return updatePetWithFormMutationResponse.parse(res.data)
}

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

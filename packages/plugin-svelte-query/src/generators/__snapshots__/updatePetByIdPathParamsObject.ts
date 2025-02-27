import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  data?: UpdatePetWithFormMutationRequest,
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}`,
    params,
    data: updatePetWithFormMutationRequest.parse(data),
    ...requestConfig,
  })
  return updatePetWithFormMutationResponse.parse(res.data)
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function createUpdatePetWithForm(
  options: {
    mutation?: CreateMutationOptions<
      UpdatePetWithFormMutationResponse,
      ResponseErrorConfig<UpdatePetWithForm405>,
      { petId: UpdatePetWithFormPathParams['petId']; data?: UpdatePetWithFormMutationRequest; params?: UpdatePetWithFormQueryParams }
    >
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey()

  return createMutation<
    UpdatePetWithFormMutationResponse,
    ResponseErrorConfig<UpdatePetWithForm405>,
    { petId: UpdatePetWithFormPathParams['petId']; data?: UpdatePetWithFormMutationRequest; params?: UpdatePetWithFormQueryParams }
  >({
    mutationFn: async ({ petId, data, params }) => {
      return updatePetWithForm({ petId }, data, params, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

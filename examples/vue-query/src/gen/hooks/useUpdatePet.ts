import client from '@kubb/plugin-client/clients/axios'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(data: UpdatePetMutationRequest, config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePet<TContext>(
  options: {
    mutation?: MutationObserverOptions<
      UpdatePetMutationResponse,
      ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
      { data: MaybeRef<UpdatePetMutationRequest> },
      TContext
    >
    client?: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetMutationKey()

  return useMutation<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, { data: UpdatePetMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return updatePet(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

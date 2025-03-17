import client from '@kubb/plugin-client/clients/axios'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../models/AddPet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHook(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
    method: 'POST',
    url: '/pet',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPetHook<TContext>(
  options: {
    mutation?: UseMutationOptions<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext>
    client?: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? addPetMutationKey()

  return useMutation<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return addPetHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client } = {}) {
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
export function useAddPet(
  options: {
    mutation?: Parameters<typeof useSWRMutation<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationKey, AddPetMutationRequest>>[2]
    client?: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKey()

  return useSWRMutation<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationKey | null, AddPetMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet(data, config)
    },
    mutationOptions,
  )
}

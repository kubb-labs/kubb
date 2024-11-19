import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: 'POST', url: '/pet', data, ...config })
  return res.data
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPet(
  options: {
    mutation?: Parameters<typeof useSWRMutation<AddPetMutationResponse, AddPet405, AddPetMutationKey, AddPetMutationRequest>>[2]
    client?: Partial<RequestConfig<AddPetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKey()
  return useSWRMutation<AddPetMutationResponse, AddPet405, AddPetMutationKey | null, AddPetMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet(data, config)
    },
    mutationOptions,
  )
}

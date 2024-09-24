import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({
    method: 'POST',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet(
  options: {
    mutation?: SWRMutationConfiguration<AddPetMutationResponse, AddPet405>
    client?: Partial<RequestConfig<AddPetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKey()
  return useSWRMutation<AddPetMutationResponse, AddPet405, Key>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet(data, config)
    },
    mutationOptions,
  )
}

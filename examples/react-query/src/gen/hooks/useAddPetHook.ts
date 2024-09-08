import client from '@kubb/plugin-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({
    method: 'post',
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
export function useAddPetHook(
  options: {
    mutation?: UseMutationOptions<
      AddPetMutationResponse,
      AddPet405,
      {
        data: AddPetMutationRequest
      }
    >
    client?: Partial<RequestConfig<AddPetMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: AddPetMutationRequest
    }) => {
      return addPet(data, config)
    },
    ...mutationOptions,
  })
}

import client from '@kubb/plugin-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { UseMutationOptions } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'

type AddPetClient = typeof client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>

type AddPet = {
  data: AddPetMutationResponse
  error: AddPet405
  request: AddPetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: AddPetMutationResponse
  client: {
    parameters: Partial<Parameters<AddPetClient>[0]>
    return: Awaited<ReturnType<AddPetClient>>
  }
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet(
  options: {
    mutation?: UseMutationOptions<AddPet['response'], AddPet['error'], AddPet['request'], unknown>
    client?: AddPet['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<AddPet['data'], AddPet['error'], AddPet['request']>({
        method: 'post',
        url: '/pet',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'

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
    mutation?: VueMutationObserverOptions<AddPet['response'], AddPet['error'], AddPet['request'], unknown>
    client?: AddPet['client']['parameters']
  } = {},
): UseMutationReturnType<AddPet['response'], AddPet['error'], AddPet['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<AddPet['response'], AddPet['error'], AddPet['request'], unknown>({
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

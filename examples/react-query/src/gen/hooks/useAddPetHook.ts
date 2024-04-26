import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

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
export function useAddPetHook(
  options: {
    mutation?: UseMutationOptions<AddPet['response'], AddPet['error'], AddPet['request']>
    client?: AddPet['client']['parameters']
  } = {},
): UseMutationResult<AddPet['response'], AddPet['error'], AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<AddPet['response'], AddPet['error'], AddPet['request']>({
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

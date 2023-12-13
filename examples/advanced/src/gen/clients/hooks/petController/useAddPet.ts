import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type AddPetClient = typeof client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>
type AddPet = {
  data: AddPetMutationResponse
  error: AddPet405
  request: AddPetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<AddPetClient>>
  client: {
    paramaters: Partial<Parameters<AddPetClient>[0]>
    return: Awaited<ReturnType<AddPetClient>>
  }
}
/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export function useAddPet(options: {
  mutation?: UseMutationOptions<AddPet['response'], AddPet['error'], AddPet['request']>
  client?: AddPet['client']['paramaters']
} = {}): UseMutationResult<AddPet['response'], AddPet['error'], AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<AddPet['response'], AddPet['error'], AddPet['request']>({
    mutationFn: async (data) => {
      const res = await client<AddPet['data'], AddPet['error'], AddPet['request']>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

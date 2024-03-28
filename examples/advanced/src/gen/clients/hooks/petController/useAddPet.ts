import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

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
    mutation?: UseMutationOptions<
      AddPet['response'],
      AddPet['error'],
      {
        data: AddPet['request']
      }
    >
    client?: AddPet['client']['parameters']
  } = {},
): UseMutationResult<
  AddPet['response'],
  AddPet['error'],
  {
    data: AddPet['request']
  }
> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<
    AddPet['response'],
    AddPet['error'],
    {
      data: AddPet['request']
    }
  >({
    mutationFn: async ({ data }) => {
      const res = await client<AddPet['data'], AddPet['error'], AddPet['request']>({
        method: 'post',
        url: '/pet',
        data,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

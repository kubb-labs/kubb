import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

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
export function addPetQuery(
  options: {
    mutation?: CreateMutationOptions<AddPet['response'], AddPet['error'], AddPet['request']>
    client?: AddPet['client']['parameters']
  } = {},
): CreateMutationResult<AddPet['response'], AddPet['error'], AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<AddPet['response'], AddPet['error'], AddPet['request']>({
    mutationFn: async (data) => {
      const res = await client<AddPet['data'], AddPet['error'], AddPet['request']>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

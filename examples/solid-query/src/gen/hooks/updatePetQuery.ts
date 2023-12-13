import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

type UpdatePetClient = typeof client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>
type UpdatePet = {
  data: UpdatePetMutationResponse
  error: UpdatePet400 | UpdatePet404 | UpdatePet405
  request: UpdatePetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: UpdatePetMutationResponse
  client: {
    paramaters: Partial<Parameters<UpdatePetClient>[0]>
    return: Awaited<ReturnType<UpdatePetClient>>
  }
}
/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet */
export function updatePetQuery(
  options: {
    mutation?: CreateMutationOptions<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']>
    client?: UpdatePet['client']['paramaters']
  } = {},
): CreateMutationResult<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']>({
    mutationFn: async (data) => {
      const res = await client<UpdatePet['data'], UpdatePet['error'], UpdatePet['request']>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

type DeletePetClient = typeof client<DeletePetMutationResponse, DeletePet400, never>
type DeletePet = {
  data: DeletePetMutationResponse
  error: DeletePet400
  request: never
  pathParams: DeletePetPathParams
  queryParams: never
  headerParams: DeletePetHeaderParams
  response: DeletePetMutationResponse
  client: {
    paramaters: Partial<Parameters<DeletePetClient>[0]>
    return: Awaited<ReturnType<DeletePetClient>>
  }
}
/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId */
export function deletePetQuery(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePet['headerParams'],
  options: {
    mutation?: CreateMutationOptions<DeletePet['response'], DeletePet['error'], void>
    client?: DeletePet['client']['paramaters']
  } = {},
): CreateMutationResult<DeletePet['response'], DeletePet['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<DeletePet['response'], DeletePet['error'], void>({
    mutationFn: async () => {
      const res = await client<DeletePet['data'], DeletePet['error'], void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

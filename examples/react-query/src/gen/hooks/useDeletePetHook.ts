import client from '@kubb/plugin-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

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
    parameters: Partial<Parameters<DeletePetClient>[0]>
    return: Awaited<ReturnType<DeletePetClient>>
  }
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePetHook(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePet['headerParams'],
  options?: {
    mutation?: UseMutationOptions<DeletePet['response'], DeletePet['error'], DeletePet['request']>
    client?: DeletePet['client']['parameters']
  },
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<DeletePet['data'], DeletePet['error']>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...options.headers },
        ...options,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

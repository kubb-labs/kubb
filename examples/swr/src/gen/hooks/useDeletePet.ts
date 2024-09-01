import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

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
export function useDeletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePet['headerParams'],
  options?: {
    mutation?: SWRMutationConfiguration<DeletePet['response'], DeletePet['error']>
    client?: DeletePet['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<DeletePet['response'], DeletePet['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  return useSWRMutation<DeletePet['response'], DeletePet['error'], Key>(
    shouldFetch ? url : null,
    async (_url) => {
      const res = await client<DeletePet['data'], DeletePet['error']>({
        method: 'delete',
        url,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}

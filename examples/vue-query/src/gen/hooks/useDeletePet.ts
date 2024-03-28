import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../models/DeletePet'

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
  refPetId: MaybeRef<DeletePetPathParams['petId']>,
  refHeaders?: MaybeRef<DeletePetHeaderParams>,
  options: {
    mutation?: VueMutationObserverOptions<DeletePet['response'], DeletePet['error'], void, unknown>
    client?: DeletePet['client']['parameters']
  } = {},
): UseMutationReturnType<DeletePet['response'], DeletePet['error'], void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeletePet['response'], DeletePet['error'], void, unknown>({
    mutationFn: async (data) => {
      const petId = unref(refPetId)
      const headers = unref(refHeaders)
      const res = await client<DeletePet['data'], DeletePet['error'], DeletePet['request']>({
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

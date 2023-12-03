import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

type DeletePetClient = typeof client<DeletePetMutationResponse, DeletePet400, never>
type DeletePet = {
  data: DeletePetMutationResponse
  error: DeletePet400
  request: never
  pathParams: DeletePetPathParams
  queryParams: never
  headerParams: DeletePetHeaderParams
  response: DeletePetMutationResponse
  unionResponse: Awaited<ReturnType<DeletePetClient>> | DeletePetMutationResponse
  client: {
    paramaters: Partial<Parameters<DeletePetClient>[0]>
    return: Awaited<ReturnType<DeletePetClient>>
  }
}
/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId */
export function useDeletePet<TData = DeletePet['response'], TError = DeletePet['error']>(
  refPetId: MaybeRef<DeletePetPathParams['petId']>,
  refHeaders?: MaybeRef<DeletePetHeaderParams>,
  options: {
    mutation?: UseMutationOptions<TData, TError, void, unknown>
    client?: DeletePet['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void, unknown>({
    mutationFn: () => {
      const petId = unref(refPetId)
      const headers = unref(refHeaders)
      return client<DeletePet['data'], TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

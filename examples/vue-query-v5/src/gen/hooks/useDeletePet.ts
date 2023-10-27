import { unref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { MaybeRef } from 'vue'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'

type DeletePet = KubbQueryFactory<
  DeletePetMutationResponse,
  DeletePet400,
  never,
  DeletePetPathParams,
  never,
  DeletePetMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */

export function useDeletePet<TData = DeletePet['response'], TError = DeletePet['error']>(
  refPetId: MaybeRef<DeletePetPathParams['petId']>,
  refHeaders?: MaybeRef<DeletePetHeaderParams>,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: DeletePet['client']['paramaters']
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, void, unknown>({
    mutationFn: () => {
      const petId = unref(refPetId)
      const headers = unref(refHeaders)
      return client<TData, TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

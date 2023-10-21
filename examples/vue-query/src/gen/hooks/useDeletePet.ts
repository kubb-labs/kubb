import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../models/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */

export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  refPetId: MaybeRef<DeletePetPathParams['petId']>,
  refHeaders?: MaybeRef<DeletePetHeaderParams>,
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
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

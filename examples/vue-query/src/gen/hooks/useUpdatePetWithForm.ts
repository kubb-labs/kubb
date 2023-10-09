import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  refPetId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  refParams?: MaybeRef<UpdatePetWithFormQueryParams>,
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void, unknown>({
    mutationFn: () => {
      const petId = unref(refPetId)
      const params = unref(refParams)
      return client<TData, TError, void>({
        method: 'post',
        url: `/pet/${petId}`,

        params,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

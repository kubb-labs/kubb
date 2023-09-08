import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = unknown, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: VueMutationObserverOptions<TData, TError, TVariables, unknown>
  client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): UseMutationReturnType<TData, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables, unknown>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

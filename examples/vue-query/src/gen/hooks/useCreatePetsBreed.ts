import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { CreatePetsBreedMutationRequest, CreatePetsBreedMutationResponse, CreatePetsBreedPathParams } from '../models/CreatePetsBreed'

/**
 * @summary Create a pet breed
 * @link /pets/:breed
 */
export function useCreatePetsBreed<TData = CreatePetsBreedMutationResponse, TError = unknown, TVariables = CreatePetsBreedMutationRequest>(
  breed: CreatePetsBreedPathParams['breed'],
  options?: {
    mutation?: VueMutationObserverOptions<TData, TError, TVariables, unknown>
  }
): UseMutationReturnType<TData, TError, TVariables, unknown> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables, unknown>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets/${breed}`,
        data,
      })
    },
    ...mutationOptions,
  })
}

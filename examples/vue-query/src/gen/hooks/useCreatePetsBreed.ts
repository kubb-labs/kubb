import { useMutation } from '@tanstack/vue-query'

import client from '@kubb/swagger-client/client'

import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { CreatePetsBreedRequest, CreatePetsBreedResponse, CreatePetsBreedPathParams } from '../models/CreatePetsBreed'

/**
 * @summary Create a pet breed
 * @link /pets/${breed}
 */
export function useCreatePetsBreed<TData = CreatePetsBreedResponse, TVariables = CreatePetsBreedRequest>(
  breed: CreatePetsBreedPathParams['breed'],
  options?: {
    mutation?: VueMutationObserverOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/pets/$${breed}`,
        data,
      })
    },
    ...mutationOptions,
  })
}

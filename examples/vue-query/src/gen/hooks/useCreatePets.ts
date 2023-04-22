import { useMutation } from '@tanstack/vue-query'

import client from '@kubb/swagger-client/client'

import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = unknown, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: VueMutationObserverOptions<TData, TError, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets`,
        data,
      })
    },
    ...mutationOptions,
  })
}

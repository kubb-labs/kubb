import { createMutation } from '@tanstack/svelte-query'

import client from '@kubb/swagger-client/client'

import type { CreateMutationOptions } from '@tanstack/svelte-query'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function createPetsQuery<TData = CreatePetsMutationResponse, TError = unknown, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: CreateMutationOptions<TData, TError, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return createMutation<TData, TError, TVariables>({
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

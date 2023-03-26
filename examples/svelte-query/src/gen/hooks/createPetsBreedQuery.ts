import { createMutation } from '@tanstack/svelte-query'

import client from '@kubb/swagger-client/client'

import type { CreateMutationOptions } from '@tanstack/svelte-query'
import type { CreatePetsBreedRequest, CreatePetsBreedResponse, CreatePetsBreedPathParams } from '../models/CreatePetsBreed'

/**
 * @summary Create a pet breed
 * @link /pets/${breed}
 */
export function createPetsBreedQuery<TData = CreatePetsBreedResponse, TVariables = CreatePetsBreedRequest>(
  breed: CreatePetsBreedPathParams['breed'],
  options?: {
    mutation?: CreateMutationOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return createMutation<TData, unknown, TVariables>({
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

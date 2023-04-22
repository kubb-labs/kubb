import { createMutation } from '@tanstack/solid-query'

import client from '@kubb/swagger-client/client'

import type { CreateMutationOptions } from '@tanstack/solid-query'
import type { CreatePetsBreedRequest, CreatePetsBreedResponse, CreatePetsBreedPathParams } from '../models/CreatePetsBreed'

/**
 * @summary Create a pet breed
 * @link /pets/:breed
 */
export function createPetsBreedQuery<TData = CreatePetsBreedResponse, TError = unknown, TVariables = CreatePetsBreedRequest>(
  breed: CreatePetsBreedPathParams['breed'],
  options?: {
    mutation?: CreateMutationOptions<TData, TError, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return createMutation<TData, TError, TVariables>({
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

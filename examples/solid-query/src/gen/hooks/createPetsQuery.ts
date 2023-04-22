import { createMutation } from '@tanstack/solid-query'

import client from '@kubb/swagger-client/client'

import type { CreateMutationOptions } from '@tanstack/solid-query'
import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function createPetsQuery<TData = CreatePetsResponse, TError = unknown, TVariables = CreatePetsRequest>(options?: {
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

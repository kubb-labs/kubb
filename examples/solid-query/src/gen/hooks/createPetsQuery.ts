import { createMutation } from '@tanstack/solid-query'

import client from '@kubb/swagger-client/client'

import type { CreateMutationOptions } from '@tanstack/solid-query'
import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function createPetsQuery<TData = CreatePetsResponse, TVariables = CreatePetsRequest>(options?: {
  mutation?: CreateMutationOptions<TData, unknown, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return createMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/pets`,
        data,
      })
    },
    ...mutationOptions,
  })
}

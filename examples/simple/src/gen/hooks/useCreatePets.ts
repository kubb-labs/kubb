import { useMutation } from '@tanstack/react-query'

import client from '@kubb/swagger-client/client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { CreatePetsRequest, CreatePetsResponse, CreatePets500 } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsResponse, TError = CreatePets500, TVariables = CreatePetsRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
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

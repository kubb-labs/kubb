import { useMutation } from '@tanstack/react-query'

import client from '@kubb/swagger-react-query/client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export const useCreatePets = <TData = CreatePetsResponse, TVariables = CreatePetsRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
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

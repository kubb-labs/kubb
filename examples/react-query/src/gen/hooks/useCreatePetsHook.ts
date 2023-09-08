import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePetsHook<TData = CreatePetsMutationResponse, TError = unknown, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
  client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

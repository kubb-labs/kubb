import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { CreatePetsBreedMutationRequest, CreatePetsBreedMutationResponse, CreatePetsBreedPathParams } from '../models/CreatePetsBreed'

/**
 * @summary Create a pet breed
 * @link /pets/:breed
 */
export function useCreatePetsBreed<TData = CreatePetsBreedMutationResponse, TError = unknown, TVariables = CreatePetsBreedMutationRequest>(
  breed: CreatePetsBreedPathParams['breed'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
  }
): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
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

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet<
  TData = UpdatePetMutationResponse,
  TError = UpdatePet400 | UpdatePet404 | UpdatePet405,
  TVariables = UpdatePetMutationRequest
>(options?: { mutation?: UseMutationOptions<TData, TError, TVariables> }): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/pet`,
        data,
      })
    },
    ...mutationOptions,
  })
}

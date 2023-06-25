import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePet400 } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError>
  }
): UseMutationResult<TData, TError> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError>({
    mutationFn: () => {
      return client<TData, TError>({
        method: 'delete',
        url: `/pet/${petId}`,
      })
    },
    ...mutationOptions,
  })
}

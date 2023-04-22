import { useMutation } from '@tanstack/react-query'

import client from '../../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeletePetResponse, DeletePetPathParams, DeletePet400 } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet<TData = DeletePetResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError>({
    mutationFn: (data) => {
      return client<TData, TError>({
        method: 'delete',
        url: `/pet/${petId}`,
      })
    },
    ...mutationOptions,
  })
}

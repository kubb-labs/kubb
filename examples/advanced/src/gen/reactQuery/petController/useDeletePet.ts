import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeletePetRequest, DeletePetResponse, DeletePetPathParams, DeletePet400 } from '../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export function useDeletePet<TData = DeletePetResponse, TError = DeletePet400, TVariables = DeletePetRequest>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: () => {
      return client<TData, TVariables>({
        method: 'delete',
        url: `/pet/${petId}`,
      })
    },
    ...mutationOptions,
  })
}

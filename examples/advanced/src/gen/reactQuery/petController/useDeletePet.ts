import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeletePetRequest, DeletePetResponse, DeletePetPathParams } from '../../models/ts/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export function useDeletePet<TData = DeletePetResponse, TVariables = DeletePetRequest>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: () => {
      return client<TData, TVariables>({
        method: 'delete',
        url: `/pet/${petId}`,
      })
    },
    ...mutationOptions,
  })
}

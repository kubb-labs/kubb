import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeletePetRequest, DeletePetResponse, DeletePetPathParams } from '../../models/ts/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export const useDeletePet = <TData = DeletePetResponse, TVariables = DeletePetRequest>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: () => {
      return axios.delete(`/pet/${petId}`).then((res) => res.data)
    },
    ...mutationOptions,
  })
}

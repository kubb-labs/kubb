import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { DeletePetRequest, DeletePetResponse } from '../models/ts/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export const useDeletePet = <TData = DeletePetResponse, TVariables = DeletePetRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.delete('/pet/{petId}').then((res) => res.data)
    },
    ...mutationOptions,
  })
}

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { DeletePetRequest, DeletePetResponse } from '../models/ts/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/{petId}
 */
export const useDeletePet = () => {
  return useMutation<DeletePetResponse, unknown, DeletePetRequest>({
    mutationFn: (data) => {
      return axios.delete('/pet/{petId}').then((res) => res.data)
    },
  })
}

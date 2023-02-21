import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { AddPetRequest, AddPetResponse } from '../models/ts/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export const useAddPet = () => {
  return useMutation<AddPetResponse, unknown, AddPetRequest>({
    mutationFn: (data) => {
      return axios.post('/pet', data).then((res) => res.data)
    },
  })
}

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UpdatePetRequest, UpdatePetResponse } from '../models/ts/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export const useUpdatePet = () => {
  return useMutation<UpdatePetResponse, unknown, UpdatePetRequest>({
    mutationFn: (data) => {
      return axios.put('/pet', data).then((res) => res.data)
    },
  })
}

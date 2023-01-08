import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export const useCreatePets = () => {
  return useMutation<CreatePetsResponse, unknown, CreatePetsRequest>({
    mutationFn: (data) => {
      return axios.post('/pets', data).then((res) => res.data)
    },
  })
}

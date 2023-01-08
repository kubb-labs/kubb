import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostPetsPetidRequest, PostPetsPetidResponse } from '../models/PostPetsPetid'

/**
 * @link /pets/{petId}
 */
export const usePostPetsPetid = () => {
  return useMutation<PostPetsPetidResponse, unknown, PostPetsPetidRequest>({
    mutationFn: (data) => {
      return axios.post('/pets/{petId}', data).then((res) => res.data)
    },
  })
}

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostPetFindbystatusRequest, PostPetFindbystatusResponse } from './models/PostPetFindbystatus'

/**
 * @link /pet/findByStatus
 */
export const usePostPetFindbystatus = () => {
  return useMutation<PostPetFindbystatusResponse, unknown, PostPetFindbystatusRequest>({
    mutationFn: (data) => {
      return axios.post('/pet/findByStatus', data).then((res) => res.data)
    },
  })
}

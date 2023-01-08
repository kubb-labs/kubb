import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostPetFindbytagsRequest, PostPetFindbytagsResponse } from './models/PostPetFindbytags'

/**
 * @link /pet/findByTags
 */
export const usePostPetFindbytags = () => {
  return useMutation<PostPetFindbytagsResponse, unknown, PostPetFindbytagsRequest>({
    mutationFn: (data) => {
      return axios.post('/pet/findByTags', data).then((res) => res.data)
    },
  })
}

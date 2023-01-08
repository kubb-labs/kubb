import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostUserUsernameRequest, PostUserUsernameResponse } from './models/PostUserUsername'

/**
 * @link /user/{username}
 */
export const usePostUserUsername = () => {
  return useMutation<PostUserUsernameResponse, unknown, PostUserUsernameRequest>({
    mutationFn: (data) => {
      return axios.post('/user/{username}', data).then((res) => res.data)
    },
  })
}

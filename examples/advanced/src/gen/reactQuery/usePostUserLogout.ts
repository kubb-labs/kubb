import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostUserLogoutRequest, PostUserLogoutResponse } from './models/PostUserLogout'

/**
 * @link /user/logout
 */
export const usePostUserLogout = () => {
  return useMutation<PostUserLogoutResponse, unknown, PostUserLogoutRequest>({
    mutationFn: (data) => {
      return axios.post('/user/logout', data).then((res) => res.data)
    },
  })
}

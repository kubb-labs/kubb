import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostUserLoginRequest, PostUserLoginResponse } from '../models/ts/PostUserLogin'

/**
 * @link /user/login
 */
export const usePostUserLogin = () => {
  return useMutation<PostUserLoginResponse, unknown, PostUserLoginRequest>({
    mutationFn: (data) => {
      return axios.post('/user/login', data).then((res) => res.data)
    },
  })
}

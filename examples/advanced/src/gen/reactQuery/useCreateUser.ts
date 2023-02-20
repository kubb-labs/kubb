import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { CreateUserRequest, CreateUserResponse } from '../models/ts/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export const useCreateUser = () => {
  return useMutation<CreateUserResponse, unknown, CreateUserRequest>({
    mutationFn: (data) => {
      return axios.post('/user', data).then((res) => res.data)
    },
  })
}

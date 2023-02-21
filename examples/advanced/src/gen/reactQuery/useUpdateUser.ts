import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UpdateUserRequest, UpdateUserResponse } from '../models/ts/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/{username}
 */
export const useUpdateUser = () => {
  return useMutation<UpdateUserResponse, unknown, UpdateUserRequest>({
    mutationFn: (data) => {
      return axios.put('/user/{username}', data).then((res) => res.data)
    },
  })
}

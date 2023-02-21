import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { DeleteUserRequest, DeleteUserResponse } from '../models/ts/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/{username}
 */
export const useDeleteUser = () => {
  return useMutation<DeleteUserResponse, unknown, DeleteUserRequest>({
    mutationFn: (data) => {
      return axios.delete('/user/{username}').then((res) => res.data)
    },
  })
}

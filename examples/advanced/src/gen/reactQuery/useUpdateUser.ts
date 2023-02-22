import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdateUserRequest, UpdateUserResponse } from '../models/ts/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/{username}
 */
export const useUpdateUser = <TData = UpdateUserResponse, TVariables = UpdateUserRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.put('/user/{username}', data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}

import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { CreateUsersWithListInputRequest, CreateUsersWithListInputResponse } from '../../models/ts/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export const useCreateUsersWithListInput = <TData = CreateUsersWithListInputResponse, TVariables = CreateUsersWithListInputRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/user/createWithList`,
        data,
      })
    },
    ...mutationOptions,
  })
}

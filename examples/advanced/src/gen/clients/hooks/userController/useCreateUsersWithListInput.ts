import { useMutation } from '@tanstack/react-query'

import client from '../../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { CreateUsersWithListInputRequest, CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput<
  TData = CreateUsersWithListInputResponse,
  TError = unknown,
  TVariables = CreateUsersWithListInputRequest
>(options?: { mutation?: UseMutationOptions<TData, TError, TVariables> }) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
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

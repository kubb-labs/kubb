import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

type UpdateUser = KubbQueryFactory<UpdateUserMutationResponse, never, never, UpdateUserPathParams, never, UpdateUserMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}> /**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUser<TData = UpdateUser['response'], TError = UpdateUser['error'], TVariables = UpdateUser['request']>(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: UpdateUser['client']['paramaters']
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

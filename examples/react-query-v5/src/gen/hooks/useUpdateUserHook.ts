import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

type UpdateUser = KubbQueryFactory<UpdateUserMutationResponse, never, never, UpdateUserPathParams, never, UpdateUserMutationResponse, {
  dataReturnType: 'data'
  type: 'mutation'
}> /**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUserHook<TData = UpdateUser['response'], TError = UpdateUser['error'], TVariables = UpdateUser['request']>(
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

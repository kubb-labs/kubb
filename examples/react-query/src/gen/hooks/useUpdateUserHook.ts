import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams, UpdateUserError } from '../models/UpdateUser'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type UpdateUser = KubbQueryFactory<
  UpdateUserMutationResponse,
  UpdateUserError,
  UpdateUserMutationRequest,
  UpdateUserPathParams,
  never,
  never,
  UpdateUserMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUserHook<TData = UpdateUser['response'], TError = UpdateUser['error']>(username: UpdateUserPathParams['username'], options: {
  mutation?: UseMutationOptions<TData, TError, UpdateUser['request']>
  client?: UpdateUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdateUser['request']>({
    mutationFn: (data) => {
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

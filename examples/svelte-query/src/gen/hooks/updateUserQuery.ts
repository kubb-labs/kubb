import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { KubbQueryFactory } from './types'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams, UpdateUserError } from '../models/UpdateUser'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

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

export function updateUserQuery<TData = UpdateUser['response'], TError = UpdateUser['error']>(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: CreateMutationOptions<TData, TError, UpdateUser['request']>
    client?: UpdateUser['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, UpdateUser['request']>({
    mutationFn: (data) => {
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

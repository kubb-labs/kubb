import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser'

type DeleteUser = KubbQueryFactory<
  DeleteUserMutationResponse,
  DeleteUser400 | DeleteUser404,
  never,
  DeleteUserPathParams,
  never,
  DeleteUserMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function deleteUserQuery<TData = DeleteUser['response'], TError = DeleteUser['error']>(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: DeleteUser['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

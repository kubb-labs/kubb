import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser'

type DeleteUser = KubbQueryFactory<
  DeleteUserMutationResponse,
  DeleteUser400 | DeleteUser404,
  never,
  DeleteUserPathParams,
  never,
  never,
  DeleteUserMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */

export function useDeleteUser<TData = DeleteUser['response'], TError = DeleteUser['error']>(username: DeleteUserPathParams['username'], options: {
  mutation?: UseMutationOptions<TData, TError, void>
  client?: DeleteUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<DeleteUser['data'], TError, void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

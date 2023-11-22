import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type DeleteUserClient = typeof client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, never>
type DeleteUser = {
  data: DeleteUserMutationResponse
  error: DeleteUser400 | DeleteUser404
  request: never
  pathParams: DeleteUserPathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<DeleteUserClient>>
  unionResponse: Awaited<ReturnType<DeleteUserClient>> | Awaited<ReturnType<DeleteUserClient>>['data']
  client: {
    paramaters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}
/**
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

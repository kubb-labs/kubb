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
  client: {
    paramaters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export function useDeleteUser(username: DeleteUserPathParams['username'], options: {
  mutation?: UseMutationOptions<DeleteUser['response'], DeleteUser['error'], void>
  client?: DeleteUser['client']['paramaters']
} = {}): UseMutationResult<DeleteUser['response'], DeleteUser['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeleteUser['response'], DeleteUser['error'], void>({
    mutationFn: async () => {
      const res = await client<DeleteUser['data'], DeleteUser['error'], void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

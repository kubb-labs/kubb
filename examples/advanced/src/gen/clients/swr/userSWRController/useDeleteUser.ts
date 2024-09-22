import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { Key } from 'swr'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser'

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
    parameters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function useDeleteUser(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: SWRMutationConfiguration<DeleteUser['response'], DeleteUser['error']>
    client?: DeleteUser['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<DeleteUser['response'], DeleteUser['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}` as const
  return useSWRMutation<DeleteUser['response'], DeleteUser['error'], Key>(
    shouldFetch ? url : null,
    async (_url) => {
      const res = await client<DeleteUser['data'], DeleteUser['error']>({
        method: 'delete',
        url,
        ...clientOptions,
      })
      return res
    },
    mutationOptions,
  )
}

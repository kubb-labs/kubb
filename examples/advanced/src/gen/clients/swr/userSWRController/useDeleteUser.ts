import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export function useDeleteUser<TData = DeleteUserMutationResponse, TError = DeleteUser400 | DeleteUser404>(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string | null, never>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string | null, never> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = shouldFetch ? `/user/${username}` : null
  return useSWRMutation<ResponseConfig<TData>, TError, string | null, never>(url, (url) => {
    return client<TData, TError>({
      method: 'delete',
      url,
      ...clientOptions,
    })
  }, mutationOptions)
}

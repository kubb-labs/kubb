import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '../../../../client'
import type { ResponseConfig } from '../../../../client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUser<TData = UpdateUserMutationResponse, TError = unknown, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<ResponseConfig<TData>, TError, string, TVariables>(
    `/user/${username}`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url,
        data,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

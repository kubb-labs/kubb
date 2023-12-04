import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export function useDeleteUser<TData = DeleteUserMutationResponse, TError = DeleteUser400 | DeleteUser404>(
  username: DeleteUserPathParams['username'],
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}` as const
  return useSWRMutation<ResponseConfig<TData>, TError, typeof url | null>(
    shouldFetch ? url : null,
    (_url) => {
      return client<TData, TError>({
        method: 'delete',
        url,
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

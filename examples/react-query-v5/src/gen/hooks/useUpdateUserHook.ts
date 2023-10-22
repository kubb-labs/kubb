import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUserHook<TData = UpdateUserMutationResponse, TError = unknown, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/user/${username}`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'

import { createMutation } from '@tanstack/solid-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { DeleteUser400, DeleteUserMutationResponse, DeleteUserPathParams } from '../models/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function deleteUserQuery<TData = DeleteUserMutationResponse, TError = DeleteUser400>(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
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

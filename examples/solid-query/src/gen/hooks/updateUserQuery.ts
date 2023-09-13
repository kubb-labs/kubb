import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function updateUserQuery<TData = UpdateUserMutationResponse, TError = unknown, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  options?: {
    mutation?: CreateMutationOptions<TData, TError, TVariables>
    client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  },
): CreateMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, TVariables>({
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

import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function createUserQuery<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(options?: {
  mutation?: CreateMutationOptions<TData, TError, TVariables>
  client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): CreateMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

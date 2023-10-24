import client from '@kubb/swagger-client/client'

import { createMutation } from '@tanstack/solid-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function createUserQuery<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, TVariables>({
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

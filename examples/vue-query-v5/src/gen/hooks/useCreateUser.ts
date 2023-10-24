import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { MutationObserverOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(
  options: {
    mutation?: MutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
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

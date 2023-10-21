import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export function useCreateUser<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
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

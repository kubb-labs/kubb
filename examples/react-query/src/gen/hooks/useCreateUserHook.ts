import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/react-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUserHook<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
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

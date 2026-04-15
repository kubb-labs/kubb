import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import { createUser } from '../../axios/userService/createUser.ts'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

export function createUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: Client } = {}) {
  const mutationKey = createUserMutationKey()
  return mutationOptions<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>({
    mutationKey,
    mutationFn: async ({ data }) => {
      return createUser({ data }, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUser<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  const baseOptions = createUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUserMutationRequest },
    TContext
  >

  return useMutation<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>
}

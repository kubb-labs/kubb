import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { createUser } from '../../axios/userService/createUser.ts'
import { useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

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
    client?: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  return useMutation<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>(
    {
      mutationFn: async ({ data }) => {
        return createUser({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

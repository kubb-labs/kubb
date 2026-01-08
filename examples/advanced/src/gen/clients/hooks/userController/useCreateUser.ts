import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUserRequestData9, CreateUserResponseData9 } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUser } from '../../axios/userService/createUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

export function createUserMutationOptions(config: Partial<RequestConfig<CreateUserRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = createUserMutationKey()
  return mutationOptions<ResponseConfig<CreateUserResponseData9>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData9 }, typeof mutationKey>({
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
    mutation?: UseMutationOptions<ResponseConfig<CreateUserResponseData9>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData9 }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<CreateUserRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  const baseOptions = createUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUserResponseData9>,
    ResponseErrorConfig<Error>,
    { data?: CreateUserRequestData9 },
    TContext
  >

  return useMutation<ResponseConfig<CreateUserResponseData9>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData9 }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUserResponseData9>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData9 }, TContext>
}

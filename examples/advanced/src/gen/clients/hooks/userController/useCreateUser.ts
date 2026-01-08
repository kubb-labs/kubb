import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserRequestData, CreateUserResponseData } from '../../../models/ts/userController/CreateUser.ts'
import { createUser } from '../../axios/userService/createUser.ts'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

export function createUserMutationOptions(config: Partial<RequestConfig<CreateUserRequestData>> & { client?: typeof fetch } = {}) {
  const mutationKey = createUserMutationKey()
  return mutationOptions<ResponseConfig<CreateUserResponseData>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData }, typeof mutationKey>({
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
    mutation?: UseMutationOptions<ResponseConfig<CreateUserResponseData>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<CreateUserRequestData>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUserMutationKey()

  const baseOptions = createUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUserResponseData>,
    ResponseErrorConfig<Error>,
    { data?: CreateUserRequestData },
    TContext
  >

  return useMutation<ResponseConfig<CreateUserResponseData>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<CreateUserResponseData>, ResponseErrorConfig<Error>, { data?: CreateUserRequestData }, TContext>
}

import client from '@kubb/plugin-client/clients/axios'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHook(
  data?: CreateUserMutationRequest,
  config: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
    method: 'POST',
    url: '/user',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUserHook<TContext>(
  options: {
    mutation?: UseMutationOptions<CreateUserMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>
    client?: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUserMutationKey()

  return useMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return createUserHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

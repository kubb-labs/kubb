import client from '@kubb/plugin-client/clients/axios'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({ method: 'POST', url: '/user', data, ...config })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function createCreateUser(
  options: {
    mutation?: CreateMutationOptions<CreateUserMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }>
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUserMutationKey()

  return createMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }>({
    mutationFn: async ({ data }) => {
      return createUser(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

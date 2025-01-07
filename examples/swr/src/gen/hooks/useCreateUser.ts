import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

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
export function useCreateUser(
  options: {
    mutation?: Parameters<typeof useSWRMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationKey, CreateUserMutationRequest>>[2]
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUserMutationKey()

  return useSWRMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationKey | null, CreateUserMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUser(data, config)
    },
    mutationOptions,
  )
}

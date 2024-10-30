import client from '@kubb/plugin-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
async function createUser(
  {
    data,
  }: {
    data?: CreateUserMutationRequest
  },
  config: Partial<RequestConfig<CreateUserMutationRequest>> = {},
) {
  const res = await client<CreateUserMutationResponse, Error, CreateUserMutationRequest>({
    method: 'POST',
    url: '/user',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser(
  options: {
    mutation?: MutationObserverOptions<
      CreateUserMutationResponse,
      Error,
      {
        data?: MaybeRef<CreateUserMutationRequest>
      }
    >
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUserMutationKey()
  return useMutation<
    CreateUserMutationResponse,
    Error,
    {
      data?: CreateUserMutationRequest
    }
  >({
    mutationFn: async ({ data }) => {
      return createUser({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

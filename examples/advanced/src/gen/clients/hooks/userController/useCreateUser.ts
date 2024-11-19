import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUserMutationResponseSchema } from '../../../zod/userController/createUserSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
async function createUser(
  {
    data,
  }: {
    data?: CreateUserMutationRequest
  },
  config: Partial<RequestConfig<CreateUserMutationRequest>> = {},
) {
  const res = await client<CreateUserMutationResponse, Error, CreateUserMutationRequest>({ method: 'POST', url: '/user', data, ...config })
  return { ...res, data: createUserMutationResponseSchema.parse(res.data) }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUser(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateUserMutationResponse>,
      Error,
      {
        data?: CreateUserMutationRequest
      }
    >
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUserMutationKey()
  return useMutation<
    ResponseConfig<CreateUserMutationResponse>,
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

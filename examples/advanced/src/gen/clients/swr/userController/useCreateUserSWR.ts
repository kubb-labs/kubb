import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import { createUserMutationResponseSchema } from '../../../zod/userController/createUserSchema.ts'

export const createUserMutationKeySWR = () => [{ url: '/user' }] as const

export type CreateUserMutationKeySWR = ReturnType<typeof createUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
async function createUserSWR({ data }: { data?: CreateUserMutationRequest }, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
    method: 'POST',
    url: '/user',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return createUserMutationResponseSchema.parse(res.data)
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUserSWR(
  options: {
    mutation?: Parameters<typeof useSWRMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationKeySWR, CreateUserMutationRequest>>[2]
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUserMutationKeySWR()

  return useSWRMutation<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationKeySWR | null, CreateUserMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUserSWR({ data }, config)
    },
    mutationOptions,
  )
}

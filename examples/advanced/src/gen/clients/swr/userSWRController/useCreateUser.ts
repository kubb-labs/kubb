import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createUserMutationResponseSchema } from '../../../zod/userController/createUserSchema.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, Error, CreateUserMutationRequest>({
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
 * @link /user
 */
export function useCreateUser(
  options: {
    mutation?: SWRMutationConfiguration<CreateUserMutationResponse, Error>
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/user'] as const
  return useSWRMutation<CreateUserMutationResponse, Error, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return createUser(data, config)
    },
    mutationOptions,
  )
}

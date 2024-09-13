import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUserMutationResponseSchema } from '../../../zod/userController/createUserSchema.ts'
import { useMutation } from '@tanstack/react-query'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
async function createUser(data?: CreateUserMutationRequest, config: Partial<RequestConfig<CreateUserMutationRequest>> = {}) {
  const res = await client<CreateUserMutationResponse, unknown, CreateUserMutationRequest>({
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
    mutation?: UseMutationOptions<
      CreateUserMutationResponse,
      unknown,
      {
        data?: CreateUserMutationRequest
      }
    >
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data?: CreateUserMutationRequest
    }) => {
      return createUser(data, config)
    },
    ...mutationOptions,
  })
}

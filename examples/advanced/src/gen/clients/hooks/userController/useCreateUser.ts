import client from '../../../../tanstack-query-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

type CreateUserClient = typeof client<CreateUserMutationResponse, never, CreateUserMutationRequest>

type CreateUser = {
  data: CreateUserMutationResponse
  error: never
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<CreateUserClient>>
  client: {
    parameters: Partial<Parameters<CreateUserClient>[0]>
    return: Awaited<ReturnType<CreateUserClient>>
  }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser(
  options: {
    mutation?: UseMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request']>
    client?: CreateUser['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<CreateUser['data'], CreateUser['error'], CreateUser['request']>({
        method: 'post',
        url: '/user',
        data,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

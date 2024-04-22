import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

type CreateUserClient = typeof client<CreateUserMutationResponse, never, CreateUserMutationRequest>
type CreateUser = {
  data: CreateUserMutationResponse
  error: never
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUserMutationResponse
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
export function createUserQuery(
  options: {
    mutation?: CreateMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request']>
    client?: CreateUser['client']['parameters']
  } = {},
): CreateMutationResult<CreateUser['response'], CreateUser['error'], CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<CreateUser['response'], CreateUser['error'], CreateUser['request']>({
    mutationFn: async (data) => {
      const res = await client<CreateUser['data'], CreateUser['error'], CreateUser['request']>({
        method: 'post',
        url: '/user',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

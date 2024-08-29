import client from '@kubb/plugin-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser.ts'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

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
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation({
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

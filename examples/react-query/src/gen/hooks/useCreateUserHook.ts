import client from '@kubb/plugin-client/client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser.ts'
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
export function useCreateUserHook(options?: {
  mutation?: UseMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request']>
  client?: CreateUser['client']['parameters']
}) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<CreateUser['data'], CreateUser['error']>({ method: 'post', url: '/user', data, ...options })
      return res.data
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

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
export function useCreateUserHook(
  options: {
    mutation?: UseMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request']>
    client?: CreateUser['client']['parameters']
  } = {},
): UseMutationResult<CreateUser['response'], CreateUser['error'], CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUser['response'], CreateUser['error'], CreateUser['request']>({
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

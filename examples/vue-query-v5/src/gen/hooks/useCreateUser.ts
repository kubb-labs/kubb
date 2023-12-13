import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse, CreateUserError } from '../models/CreateUser'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'

type CreateUserClient = typeof client<CreateUserMutationResponse, CreateUserError, CreateUserMutationRequest>
type CreateUser = {
  data: CreateUserMutationResponse
  error: CreateUserError
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUserMutationResponse
  client: {
    paramaters: Partial<Parameters<CreateUserClient>[0]>
    return: Awaited<ReturnType<CreateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user */
export function useCreateUser(
  options: {
    mutation?: UseMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown>
    client?: CreateUser['client']['paramaters']
  } = {},
): UseMutationReturnType<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown>({
    mutationFn: async (data) => {
      const res = await client<CreateUser['data'], CreateUser['error'], CreateUser['request']>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

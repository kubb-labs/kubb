import client from '@kubb/plugin-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'

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
export function useCreateUser(
  options: {
    mutation?: VueMutationObserverOptions<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown>
    client?: CreateUser['client']['parameters']
  } = {},
): UseMutationReturnType<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUser['response'], CreateUser['error'], CreateUser['request'], unknown>({
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

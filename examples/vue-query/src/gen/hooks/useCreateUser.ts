import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse, CreateUserError } from '../models/CreateUser'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'

type CreateUserClient = typeof client<CreateUserMutationResponse, CreateUserError, CreateUserMutationRequest>
type CreateUser = {
  data: CreateUserMutationResponse
  error: CreateUserError
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<CreateUserClient>>['data']
  unionResponse: Awaited<ReturnType<CreateUserClient>> | Awaited<ReturnType<CreateUserClient>>['data']
  client: {
    paramaters: Partial<Parameters<CreateUserClient>[0]>
    return: Awaited<ReturnType<CreateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user */
export function useCreateUser<TData = CreateUser['response'], TError = CreateUser['error']>(
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, CreateUser['request'], unknown>
    client?: CreateUser['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, CreateUser['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreateUser['request'], unknown>({
    mutationFn: (data) => {
      return client<CreateUser['data'], TError, CreateUser['request']>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

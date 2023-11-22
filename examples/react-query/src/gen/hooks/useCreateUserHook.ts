import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse, CreateUserError } from '../models/CreateUser'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

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
 * @link /user
 */
export function useCreateUserHook<TData = CreateUser['response'], TError = CreateUser['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, CreateUser['request']>
  client?: CreateUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreateUser['request']>({
    mutationFn: (data) => {
      return client<CreateUser['data'], TError, CreateUser['request']>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

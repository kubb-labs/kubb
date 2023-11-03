import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

type CreateUser = KubbQueryFactory<CreateUserMutationResponse, never, CreateUserMutationRequest, never, never, never, CreateUserMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}> /**
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

import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

type CreateUser = KubbQueryFactory<
  CreateUserMutationResponse,
  never,
  CreateUserMutationRequest,
  never,
  never,
  never,
  CreateUserMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export function createUserQuery<TData = CreateUser['response'], TError = CreateUser['error']>(
  options: {
    mutation?: CreateMutationOptions<TData, TError, CreateUser['request']>
    client?: CreateUser['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<TData, TError, CreateUser['request']>({
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

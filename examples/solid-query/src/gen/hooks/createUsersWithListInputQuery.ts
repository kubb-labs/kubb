import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput'

type CreateUsersWithListInput = KubbQueryFactory<
  CreateUsersWithListInputMutationResponse,
  never,
  never,
  never,
  never,
  CreateUsersWithListInputMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function createUsersWithListInputQuery<
  TData = CreateUsersWithListInput['response'],
  TError = CreateUsersWithListInput['error'],
  TVariables = CreateUsersWithListInput['request'],
>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: CreateUsersWithListInput['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user/createWithList`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

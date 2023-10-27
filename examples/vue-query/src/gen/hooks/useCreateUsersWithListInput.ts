import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { UseMutationReturnType } from '@tanstack/vue-query'
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

export function useCreateUsersWithListInput<
  TData = CreateUsersWithListInput['response'],
  TError = CreateUsersWithListInput['error'],
  TVariables = CreateUsersWithListInput['request'],
>(
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: CreateUsersWithListInput['client']['paramaters']
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
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

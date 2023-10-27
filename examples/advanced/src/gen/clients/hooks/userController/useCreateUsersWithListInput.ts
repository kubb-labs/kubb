import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { CreateUsersWithListInputMutationResponse } from '../../../models/ts/userController/CreateUsersWithListInput'

type CreateUsersWithListInput = KubbQueryFactory<
  CreateUsersWithListInputMutationResponse,
  never,
  never,
  never,
  never,
  CreateUsersWithListInputMutationResponse,
  {
    dataReturnType: 'full'
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
>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: CreateUsersWithListInput['client']['paramaters']
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
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

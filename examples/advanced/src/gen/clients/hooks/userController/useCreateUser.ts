import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

type CreateUser = KubbQueryFactory<CreateUserMutationResponse, never, never, never, never, CreateUserMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}> /**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export function useCreateUser<TData = CreateUser['response'], TError = CreateUser['error'], TVariables = CreateUser['request']>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: CreateUser['client']['paramaters']
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

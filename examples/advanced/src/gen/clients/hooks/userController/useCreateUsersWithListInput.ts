import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
} from '../../../models/ts/userController/CreateUsersWithListInput'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type CreateUsersWithListInput = KubbQueryFactory<
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  never,
  never,
  never,
  CreateUsersWithListInputMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput<TData = CreateUsersWithListInput['response'], TError = CreateUsersWithListInput['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, CreateUsersWithListInput['request']>
  client?: CreateUsersWithListInput['client']['paramaters']
} = {}): UseMutationResult<TData, TError, CreateUsersWithListInput['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreateUsersWithListInput['request']>({
    mutationFn: (data) => {
      return client<CreateUsersWithListInput['data'], TError, CreateUsersWithListInput['request']>({
        method: 'post',
        url: `/user/createWithList`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

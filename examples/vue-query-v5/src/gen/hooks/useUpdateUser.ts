import { unref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { MaybeRef } from 'vue'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

type UpdateUser = KubbQueryFactory<
  UpdateUserMutationResponse,
  never,
  UpdateUserMutationRequest,
  UpdateUserPathParams,
  never,
  never,
  UpdateUserMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUser<TData = UpdateUser['response'], TError = UpdateUser['error']>(
  refUsername: MaybeRef<UpdateUserPathParams['username']>,
  options: {
    mutation?: UseMutationOptions<TData, TError, UpdateUser['request'], unknown>
    client?: UpdateUser['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, UpdateUser['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdateUser['request'], unknown>({
    mutationFn: (data) => {
      const username = unref(refUsername)
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUser<TData = UpdateUserMutationResponse, TError = unknown, TVariables = UpdateUserMutationRequest>(
  refUsername: MaybeRef<UpdateUserPathParams['username']>,
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
    mutationFn: (data) => {
      const username = unref(refUsername)
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/user/${username}`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

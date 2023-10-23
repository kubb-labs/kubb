import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { MutationObserverOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { DeleteUser400, DeleteUserMutationResponse, DeleteUserPathParams } from '../models/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */

export function useDeleteUser<TData = DeleteUserMutationResponse, TError = DeleteUser400>(
  refUsername: MaybeRef<DeleteUserPathParams['username']>,
  options: {
    mutation?: MutationObserverOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void, unknown>({
    mutationFn: () => {
      const username = unref(refUsername)
      return client<TData, TError, void>({
        method: 'delete',
        url: `/user/${username}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

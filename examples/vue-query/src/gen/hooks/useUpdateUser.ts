import client from '@kubb/plugin-client/clients/axios'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUser(
  { username }: { username: UpdateUserPathParams['username'] },
  data?: UpdateUserMutationRequest,
  config: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdateUserMutationResponse, ResponseErrorConfig<Error>, UpdateUserMutationRequest>({
    method: 'PUT',
    url: `/user/${username}`,
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUser<TContext>(
  options: {
    mutation?: MutationObserverOptions<
      UpdateUserMutationResponse,
      ResponseErrorConfig<Error>,
      { username: MaybeRef<UpdateUserPathParams['username']>; data?: MaybeRef<UpdateUserMutationRequest> },
      TContext
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()

  return useMutation<
    UpdateUserMutationResponse,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
  >({
    mutationFn: async ({ username, data }) => {
      return updateUser({ username }, data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

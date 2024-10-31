import client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
async function updateUser(
  {
    username,
    data,
  }: {
    username: UpdateUserPathParams['username']
    data?: UpdateUserMutationRequest
  },
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, Error, UpdateUserMutationRequest>({ method: 'PUT', url: `/user/${username}`, data, ...config })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUser(
  options: {
    mutation?: MutationObserverOptions<
      UpdateUserMutationResponse,
      Error,
      {
        username: MaybeRef<UpdateUserPathParams['username']>
        data?: MaybeRef<UpdateUserMutationRequest>
      }
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()
  return useMutation<
    UpdateUserMutationResponse,
    Error,
    {
      username: UpdateUserPathParams['username']
      data?: UpdateUserMutationRequest
    }
  >({
    mutationFn: async ({ username, data }) => {
      return updateUser({ username, data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

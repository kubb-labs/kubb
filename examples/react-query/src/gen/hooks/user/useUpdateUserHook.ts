import client from '@kubb/plugin-client/clients/axios'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/UpdateUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
async function updateUserHook(
  { username }: { username: UpdateUserPathParams['username'] },
  data?: UpdateUserMutationRequest,
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, Error, UpdateUserMutationRequest>({ method: 'PUT', url: `/user/${username}`, data, ...config })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUserHook(
  options: {
    mutation?: UseMutationOptions<UpdateUserMutationResponse, Error, { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest }>
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()

  return useMutation<UpdateUserMutationResponse, Error, { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest }>({
    mutationFn: async ({ username, data }) => {
      return updateUserHook({ username }, data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

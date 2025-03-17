import client from '@kubb/plugin-client/clients/axios'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../models/DeleteUser.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const deleteUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type DeleteUserMutationKey = ReturnType<typeof deleteUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUserHook(
  { username }: { username: DeleteUserPathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: `/user/${username}`,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export function useDeleteUserHook<TContext>(
  options: {
    mutation?: UseMutationOptions<
      DeleteUserMutationResponse,
      ResponseErrorConfig<DeleteUser400 | DeleteUser404>,
      { username: DeleteUserPathParams['username'] },
      TContext
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deleteUserMutationKey()

  return useMutation<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, { username: DeleteUserPathParams['username'] }, TContext>({
    mutationFn: async ({ username }) => {
      return deleteUserHook({ username }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

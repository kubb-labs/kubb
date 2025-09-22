import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { updateUser } from '../../axios/userService/updateUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

export function updateUserMutationOptions(config: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ username, data }) => {
      return updateUser({ username, data }, config)
    },
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUser<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdateUserMutationResponse>,
      ResponseErrorConfig<Error>,
      { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateUserMutationKey()

  return useMutation(
    {
      ...updateUserMutationOptions(config),
      mutationKey,
      ...mutationOptions,
    } as unknown as UseMutationOptions,
    queryClient,
  ) as UseMutationOptions<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
  >
}

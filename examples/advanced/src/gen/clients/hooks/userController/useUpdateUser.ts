import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUser } from '../../axios/userService/updateUser.ts'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

export function updateUserMutationOptions(config: Partial<RequestConfig<UpdateUserRequestData>> & { client?: typeof fetch } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateUserResponseData>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
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
      ResponseConfig<UpdateUserResponseData>,
      ResponseErrorConfig<Error>,
      { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdateUserRequestData>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateUserMutationKey()

  const baseOptions = updateUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdateUserResponseData>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdateUserResponseData>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdateUserResponseData>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
    TContext
  >
}

import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserRequestData9, UpdateUserResponseData9, UpdateUserPathParams9 } from '../../../models/ts/userController/UpdateUser.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updateUser } from '../../axios/userService/updateUser.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

export function updateUserMutationOptions(config: Partial<RequestConfig<UpdateUserRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateUserResponseData9>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams9['username']; data?: UpdateUserRequestData9 },
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
      ResponseConfig<UpdateUserResponseData9>,
      ResponseErrorConfig<Error>,
      { username: UpdateUserPathParams9['username']; data?: UpdateUserRequestData9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdateUserRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateUserMutationKey()

  const baseOptions = updateUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdateUserResponseData9>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams9['username']; data?: UpdateUserRequestData9 },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdateUserResponseData9>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams9['username']; data?: UpdateUserRequestData9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdateUserResponseData9>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams9['username']; data?: UpdateUserRequestData9 },
    TContext
  >
}

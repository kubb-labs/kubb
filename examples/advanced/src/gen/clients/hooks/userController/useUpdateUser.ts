import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUser } from '../../axios/userService/updateUser.ts'

export const updateUserMutationKey = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

export function updateUserMutationOptions<TContext = unknown>(config: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: Client } = {}) {
  const mutationKey = updateUserMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
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
    client?: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateUserMutationKey()

  const baseOptions = updateUserMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
    TContext
  >
}

import client from '../../../../tanstack-query-client'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../tanstack-query-client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updateUserMutationResponseSchema } from '../../../zod/userController/updateUserSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
async function updateUser(
  { username, data }: { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest },
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, ResponseErrorConfig<Error>, UpdateUserMutationRequest>({
    method: 'PUT',
    url: `/user/${username}`,
    data,
    ...config,
  })
  return { ...res, data: updateUserMutationResponseSchema.parse(res.data) }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUser(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdateUserMutationResponse>,
      ResponseErrorConfig<Error>,
      { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest }
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()

  return useMutation<
    ResponseConfig<UpdateUserMutationResponse>,
    ResponseErrorConfig<Error>,
    { username: UpdateUserPathParams['username']; data?: UpdateUserMutationRequest }
  >({
    mutationFn: async ({ username, data }) => {
      return updateUser({ username, data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

import client from '../../../../tanstack-query-client.js'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.js'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.js'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updateUserMutationResponseSchema } from '../../../zod/userController/updateUserSchema.js'
import { useMutation } from '@tanstack/react-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
async function updateUser(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserMutationRequest,
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, Error, UpdateUserMutationRequest>({
    method: 'PUT',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return { ...res, data: updateUserMutationResponseSchema.parse(res.data) }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUser(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdateUserMutationResponse>,
      Error,
      {
        username: UpdateUserPathParams['username']
        data?: UpdateUserMutationRequest
      }
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()
  return useMutation<
    ResponseConfig<UpdateUserMutationResponse>,
    Error,
    {
      username: UpdateUserPathParams['username']
      data?: UpdateUserMutationRequest
    }
  >({
    mutationFn: async ({ username, data }) => {
      return updateUser(username, data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

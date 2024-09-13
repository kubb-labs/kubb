import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updateUserMutationResponseSchema } from '../../../zod/userController/updateUserSchema.ts'
import { useMutation } from '@tanstack/react-query'

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
  const res = await client<UpdateUserMutationResponse, unknown, UpdateUserMutationRequest>({
    method: 'PUT',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return updateUserMutationResponseSchema.parse(res.data)
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUser(
  options: {
    mutation?: UseMutationOptions<
      UpdateUserMutationResponse,
      unknown,
      {
        username: UpdateUserPathParams['username']
        data?: UpdateUserMutationRequest
      }
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      username,
      data,
    }: {
      username: UpdateUserPathParams['username']
      data?: UpdateUserMutationRequest
    }) => {
      return updateUser(username, data, config)
    },
    ...mutationOptions,
  })
}

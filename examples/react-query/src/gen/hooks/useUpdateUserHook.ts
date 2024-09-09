import client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
async function updateUser(
  {
    username,
  }: {
    username: UpdateUserPathParams['username']
  },
  data?: UpdateUserMutationRequest,
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, unknown, UpdateUserMutationRequest>({
    method: 'put',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUserHook(
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
      return updateUser({ username }, data, config)
    },
    ...mutationOptions,
  })
}

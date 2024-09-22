/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export async function updateUser(
  {
    username,
  }: {
    username: UpdateUserPathParams['username']
  },
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
  return res.data
}

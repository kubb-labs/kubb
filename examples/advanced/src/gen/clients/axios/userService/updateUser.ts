import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser'

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
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdateUserMutationResponse>> {
  const res = await client<UpdateUserMutationResponse, UpdateUserMutationRequest>({
    method: 'put',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...options,
  })
  return res
}

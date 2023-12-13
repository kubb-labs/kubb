import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserMutation } from '../../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username */
export async function updateUser(
  { username }: UpdateUserMutation.PathParams,
  data?: UpdateUserMutation.Request,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UpdateUserMutation.Response>> {
  const res = await client<UpdateUserMutation.Response, UpdateUserMutation.Request>({
    method: 'put',
    url: `/user/${username}`,
    data,
    ...options,
  })
  return res
}

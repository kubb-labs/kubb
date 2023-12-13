import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutation } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export async function deleteUser(
  { username }: DeleteUserMutation.PathParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeleteUserMutation.Response>> {
  const res = await client<DeleteUserMutation.Response>({
    method: 'delete',
    url: `/user/${username}`,
    ...options,
  })
  return res
}

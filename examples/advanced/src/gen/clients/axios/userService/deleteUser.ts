import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { DeleteUserMutationResponse, DeleteUserPathParams } from '../../../models/ts/userController/DeleteUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export async function deleteUser<TData = DeleteUserMutationResponse>(
  { username }: DeleteUserPathParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>> {
  return client<TData>({
    method: 'delete',
    url: `/user/${username}`,
    ...options,
  })
}

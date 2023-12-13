import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LogoutUserQuery } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export async function logoutUser(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<LogoutUserQuery.Response>> {
  const res = await client<LogoutUserQuery.Response>({
    method: 'get',
    url: `/user/logout`,
    ...options,
  })
  return res
}

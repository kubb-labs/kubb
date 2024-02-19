import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export async function logoutUser(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<LogoutUserQueryResponse>> {
  const res = await client<LogoutUserQueryResponse>({
    method: 'get',
    url: `/user/logout`,
    ...options,
  })
  return res
}

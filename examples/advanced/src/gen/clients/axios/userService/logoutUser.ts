import client from '../../../../axios-client.ts'

import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LogoutUserQueryResponse } from '../../../models/ts/userController/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export async function logoutUser<TData = LogoutUserQueryResponse>(options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<TData>> {
  return client<TData>({
    method: 'get',
    url: `/user/logout`,
    ...options,
  })
}

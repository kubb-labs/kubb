import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetcher.ts'
import fetch from '../../.kubb/fetcher.ts'
import type { LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/user/logout',
    baseURL: 'https://petstore.swagger.io/v2',
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

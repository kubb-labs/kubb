import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { LogoutUserQueryResponse } from '../models/ts/LogoutUser.js'

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

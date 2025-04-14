import client from '@kubb/plugin-client/clients/axios'
import type { LogoutUserQueryResponse } from '../models/ts/LogoutUser.js'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserHandler(): Promise<Promise<CallToolResult>> {
  const res = await client<LogoutUserQueryResponse, ResponseErrorConfig<Error>, unknown>({
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

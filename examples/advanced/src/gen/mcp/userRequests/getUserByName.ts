import fetch from '@kubb/plugin-client/clients/axios'
import type {
  GetUserByNameResponseData,
  GetUserByNamePathParams,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../models/ts/userController/GetUserByName.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByNameHandler({ username }: { username: GetUserByNamePathParams['username'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetUserByNameResponseData, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
    method: 'GET',
    url: `/user/${username}`,
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

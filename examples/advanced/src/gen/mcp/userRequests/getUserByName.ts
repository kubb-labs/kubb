import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetch.ts'
import { fetch } from '../../.kubb/fetch.ts'
import type { GetUserByName400, GetUserByName404, GetUserByNamePathParams, GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByNameHandler({ username }: { username: GetUserByNamePathParams['username'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
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

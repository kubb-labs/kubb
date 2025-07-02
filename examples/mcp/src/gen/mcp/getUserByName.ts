import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../models/ts/GetUserByName.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

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

import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../models/ts/LoginUser.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUserHandler({ params }: { params?: LoginUserQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await client<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, unknown>({
    method: 'GET',
    url: '/user/login',
    baseURL: 'https://petstore.swagger.io/v2',
    params,
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

import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetcher.ts'
import fetch from '../../.kubb/fetcher.ts'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUserHandler({ params }: { params?: LoginUserQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await fetch<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, unknown>({
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

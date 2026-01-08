import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { LoginUserQueryParams, LoginUserResponseData, LoginUserStatus400 } from '../../models/ts/userController/LoginUser.ts'

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUserHandler({ params }: { params?: LoginUserQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await fetch<LoginUserResponseData, ResponseErrorConfig<LoginUserStatus400>, unknown>({
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

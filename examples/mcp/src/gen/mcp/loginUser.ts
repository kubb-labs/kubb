import type client from '@kubb/plugin-client/clients/axios'
import type { LoginUserQueryParams } from '../models/ts/LoginUser.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { loginUser } from '../clients/loginUser.js'

export async function loginUserHandler(
  params?: LoginUserQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
): Promise<Promise<CallToolResult>> {
  const res = await loginUser(params, config)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res),
      },
    ],
  }
}

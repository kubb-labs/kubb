import fetch from '@kubb/plugin-client/clients/axios'
import type { CreateUserRequestData, CreateUserResponseData } from '../../models/ts/userController/CreateUser.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserRequestData }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateUserResponseData, ResponseErrorConfig<Error>, CreateUserRequestData>({
    method: 'POST',
    url: '/user',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
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

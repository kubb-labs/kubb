import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { CreateUserRequestData, CreateUserResponseData } from '../models/ts/CreateUser.js'

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

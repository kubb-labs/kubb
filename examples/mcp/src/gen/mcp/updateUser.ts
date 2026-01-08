import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData } from '../models/ts/UpdateUser.js'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUserHandler({
  username,
  data,
}: {
  username: UpdateUserPathParams['username']
  data?: UpdateUserRequestData
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<UpdateUserResponseData, ResponseErrorConfig<Error>, UpdateUserRequestData>({
    method: 'PUT',
    url: `/user/${username}`,
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

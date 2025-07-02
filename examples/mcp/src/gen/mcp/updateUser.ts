import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/ts/UpdateUser.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

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
  data?: UpdateUserMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data
  const res = await client<UpdateUserMutationResponse, ResponseErrorConfig<Error>, UpdateUserMutationRequest>({
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

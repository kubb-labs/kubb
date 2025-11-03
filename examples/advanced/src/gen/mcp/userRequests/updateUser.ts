import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetcher.ts'
import fetch from '../../.kubb/fetcher.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'

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

  const res = await fetch<UpdateUserMutationResponse, ResponseErrorConfig<Error>, UpdateUserMutationRequest>({
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

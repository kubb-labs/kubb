import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../.kubb/fetch.ts'
import { fetch } from '../../.kubb/fetch.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
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

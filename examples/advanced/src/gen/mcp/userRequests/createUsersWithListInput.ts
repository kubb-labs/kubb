import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../models/ts/userController/CreateUsersWithListInput.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInputHandler({ data }: { data?: CreateUsersWithListInputRequestData }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateUsersWithListInputResponseData, ResponseErrorConfig<Error>, CreateUsersWithListInputRequestData>({
    method: 'POST',
    url: '/user/createWithList',
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

import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from './models.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUsersWithListInputMutationResponse>['data']> {
  const res = await client<CreateUsersWithListInputMutationResponse, CreateUsersWithListInputMutationRequest>({
    method: 'post',
    url: '/user/createWithList',
    data,
    ...options,
  })
  return res.data
}

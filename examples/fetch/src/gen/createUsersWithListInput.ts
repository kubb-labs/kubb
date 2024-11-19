import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from './models.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, Error, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    data,
    ...config,
  })
  return res.data
}

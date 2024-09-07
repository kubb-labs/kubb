import client from '../client.ts'
import type { RequestConfig } from '../client.ts'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from './models.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export async function createUsersWithListInput(data?: CreateUsersWithListInputMutationRequest, config: Partial<RequestConfig> = {}) {
  const res = await client<CreateUsersWithListInputMutationResponse, CreateUsersWithListInputMutationRequest>({
    method: 'post',
    url: '/user/createWithList',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return res.data
}

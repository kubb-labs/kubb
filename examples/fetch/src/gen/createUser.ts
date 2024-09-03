import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from './models.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export async function createUser(
  data?: CreateUserMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUserMutationResponse>['data']> {
  const res = await client<CreateUserMutationResponse, CreateUserMutationRequest>({ method: 'post', url: '/user', data, ...options })
  return res.data
}

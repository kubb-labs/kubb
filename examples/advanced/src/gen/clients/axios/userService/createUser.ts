import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUserMutation } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user */
export async function createUser(
  data?: CreateUserMutation.Request,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUserMutation.Response>> {
  const res = await client<CreateUserMutation.Response, CreateUserMutation.Request>({
    method: 'post',
    url: `/user`,
    data,
    ...options,
  })
  return res
}

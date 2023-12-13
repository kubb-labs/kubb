import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputMutation } from '../../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutation.Request,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUsersWithListInputMutation.Response>> {
  const res = await client<CreateUsersWithListInputMutation.Response, CreateUsersWithListInputMutation.Request>({
    method: 'post',
    url: `/user/createWithList`,
    data,
    ...options,
  })
  return res
}

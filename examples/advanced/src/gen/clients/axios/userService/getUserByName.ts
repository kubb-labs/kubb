import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { GetUserByNameQuery } from '../../../models/ts/userController/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/:username */
export async function getUserByName(
  { username }: GetUserByNameQuery.PathParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetUserByNameQuery.Response>> {
  const res = await client<GetUserByNameQuery.Response>({
    method: 'get',
    url: `/user/${username}`,
    ...options,
  })
  return res
}

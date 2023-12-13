import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { LoginUserQuery } from '../../../models/ts/userController/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login */
export async function loginUser(
  params?: LoginUserQuery.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<LoginUserQuery.Response>> {
  const res = await client<LoginUserQuery.Response>({
    method: 'get',
    url: `/user/login`,
    params,
    ...options,
  })
  return res
}

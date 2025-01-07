import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'

export function getLoginUserUrl() {
  return new URL('/user/login', 'https://petstore3.swagger.io/api/v3')
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, unknown>({
    method: 'GET',
    url: getLoginUserUrl().toString(),
    params,
    ...config,
  })
  return res
}

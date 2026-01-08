import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LoginUserResponseData, LoginUserQueryParams, LoginUserStatus400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUserResponseData2Schema } from '../../../zod/userController/loginUserSchema.ts'

export function getLoginUserUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/user/login' as const }
  return res
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LoginUserResponseData, ResponseErrorConfig<LoginUserStatus400>, unknown>({
    method: 'GET',
    url: getLoginUserUrl().url.toString(),
    params,
    ...requestConfig,
  })
  return { ...res, data: loginUserResponseData2Schema.parse(res.data) }
}

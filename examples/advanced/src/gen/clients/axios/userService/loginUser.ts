import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUserQueryResponseSchema } from '../../../zod/userController/loginUserSchema.ts'

function getLoginUserUrl() {
  return `https://petstore3.swagger.io/api/v3/user/login` as const
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser({ params }: { params?: LoginUserQueryParams }, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LoginUserQueryResponse, ResponseErrorConfig<LoginUser400>, unknown>({
    method: 'GET',
    url: getLoginUserUrl().toString(),
    params,
    ...requestConfig,
  })
  return { ...res, data: loginUserQueryResponseSchema.parse(res.data) }
}

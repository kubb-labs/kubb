import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  GetUserByNamePathParams,
  GetUserByNameResponseData,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByNameResponseDataSchema } from '../../../zod/userController/getUserByNameSchema.ts'

export function getGetUserByNameUrl({ username }: { username: GetUserByNamePathParams['username'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }
  return res
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetUserByNameResponseData, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: getUserByNameResponseDataSchema.parse(res.data) }
}

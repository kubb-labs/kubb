import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByNameQueryResponseSchema } from '../../../zod/userController/getUserByNameSchema.ts'

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

  const res = await request<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: getUserByNameQueryResponseSchema.parse(res.data) }
}

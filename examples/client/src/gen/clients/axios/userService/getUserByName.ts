/* eslint-disable no-alert, no-console */
import fetch from '@kubb/plugin-client/clients/fetch'
import type {
  GetUserByNamePathParams,
  GetUserByNameQueryResponse,
  GetUserByName400,
  GetUserByName404,
} from '../../../models/ts/userController/GetUserByName.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getGetUserByNameUrl({ username }: { username: GetUserByNamePathParams['username'] }) {
  const res = { method: 'GET', url: `/user/${username}` as const }
  return res
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })
  return res.data
}

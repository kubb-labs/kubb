/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import client from '@/lib/axios-client'
import type { GetUserByNameQueryResponse, GetUserByNamePathParams, GetUserByName400, GetUserByName404 } from '../../types/userApi/GetUserByName.ts'
import type { RequestConfig, ResponseErrorConfig } from '@/lib/axios-client'

export function getGetUserByNameUrl({ username }: { username: GetUserByNamePathParams['username'] }) {
  return `/user/${username}` as const
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName(
  { username }: { username: GetUserByNamePathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetUserByNameQueryResponse, ResponseErrorConfig<GetUserByName400 | GetUserByName404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).toString(),
    ...requestConfig,
  })
  return res.data
}

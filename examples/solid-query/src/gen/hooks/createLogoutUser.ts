import client from '@kubb/plugin-client/client'
import type { LogoutUserQueryResponse } from '../models/LogoutUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import { queryOptions } from '@tanstack/solid-query'

export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const

export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
  const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: 'GET', url: '/user/logout', ...config })
  return res.data
}

export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
  const queryKey = logoutUserQueryKey()
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return logoutUser(config)
    },
  })
}

import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AppControllerGetStatusQueryResponse } from '../../../models/ts/appController/AppControllerGetStatus.ts'
import { appControllerGetStatus } from '../../axios/AppService/appControllerGetStatus.ts'

export const appControllerGetStatusQueryKeySWR = () => [{ url: '/api/status' }] as const

export type AppControllerGetStatusQueryKeySWR = ReturnType<typeof appControllerGetStatusQueryKeySWR>

export function appControllerGetStatusQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return appControllerGetStatus(config)
    },
  }
}

/**
 * {@link /api/status}
 */
export function useAppControllerGetStatusSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<AppControllerGetStatusQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = appControllerGetStatusQueryKeySWR()

  return useSWR<ResponseConfig<AppControllerGetStatusQueryResponse>, ResponseErrorConfig<Error>, AppControllerGetStatusQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...appControllerGetStatusQueryOptionsSWR(config),
      ...(immutable
        ? {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }
        : {}),
      ...queryOptions,
    },
  )
}

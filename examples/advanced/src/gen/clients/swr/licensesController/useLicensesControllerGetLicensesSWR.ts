import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { LicensesControllerGetLicensesQueryResponse } from '../../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import { licensesControllerGetLicenses } from '../../axios/LicensesService/licensesControllerGetLicenses.ts'

export const licensesControllerGetLicensesQueryKeySWR = () => [{ url: '/api/licenses' }] as const

export type LicensesControllerGetLicensesQueryKeySWR = ReturnType<typeof licensesControllerGetLicensesQueryKeySWR>

export function licensesControllerGetLicensesQueryOptionsSWR(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return licensesControllerGetLicenses(config)
    },
  }
}

/**
 * {@link /api/licenses}
 */
export function useLicensesControllerGetLicensesSWR(
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<LicensesControllerGetLicensesQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = licensesControllerGetLicensesQueryKeySWR()

  return useSWR<ResponseConfig<LicensesControllerGetLicensesQueryResponse>, ResponseErrorConfig<Error>, LicensesControllerGetLicensesQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...licensesControllerGetLicensesQueryOptionsSWR(config),
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

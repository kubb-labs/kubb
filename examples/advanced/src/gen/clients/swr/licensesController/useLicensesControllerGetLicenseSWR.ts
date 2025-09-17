import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerGetLicenseQueryResponse,
  LicensesControllerGetLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import { licensesControllerGetLicense } from '../../axios/LicensesService/licensesControllerGetLicense.ts'

export const licensesControllerGetLicenseQueryKeySWR = ({ id }: { id: LicensesControllerGetLicensePathParams['id'] }) =>
  [{ url: '/api/licenses/:id', params: { id: id } }] as const

export type LicensesControllerGetLicenseQueryKeySWR = ReturnType<typeof licensesControllerGetLicenseQueryKeySWR>

export function licensesControllerGetLicenseQueryOptionsSWR(
  { id }: { id: LicensesControllerGetLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return licensesControllerGetLicense({ id }, config)
    },
  }
}

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerGetLicenseSWR(
  { id }: { id: LicensesControllerGetLicensePathParams['id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<LicensesControllerGetLicenseQueryResponse>, ResponseErrorConfig<Error>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = licensesControllerGetLicenseQueryKeySWR({ id })

  return useSWR<ResponseConfig<LicensesControllerGetLicenseQueryResponse>, ResponseErrorConfig<Error>, LicensesControllerGetLicenseQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...licensesControllerGetLicenseQueryOptionsSWR({ id }, config),
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

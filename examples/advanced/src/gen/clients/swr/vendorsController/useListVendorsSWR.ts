import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ListVendors400,
  ListVendors401,
  ListVendors403,
  ListVendorsQueryParams,
  ListVendorsQueryResponse,
} from '../../../models/ts/vendorsController/ListVendors.ts'
import { listVendors } from '../../axios/VendorsService/listVendors.ts'

export const listVendorsQueryKeySWR = (params?: ListVendorsQueryParams) => [{ url: '/v1/vendors' }, ...(params ? [params] : [])] as const

export type ListVendorsQueryKeySWR = ReturnType<typeof listVendorsQueryKeySWR>

export function listVendorsQueryOptionsSWR({ params }: { params?: ListVendorsQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return listVendors({ params }, config)
    },
  }
}

/**
 * @description This endpoint lists all existing vendors for an account.Takes an optional parameter to match by vendor name.
 * @summary Lists vendors
 * {@link /v1/vendors}
 */
export function useListVendorsSWR(
  { params }: { params?: ListVendorsQueryParams },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<ListVendorsQueryResponse>, ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = listVendorsQueryKeySWR(params)

  return useSWR<ResponseConfig<ListVendorsQueryResponse>, ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>, ListVendorsQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...listVendorsQueryOptionsSWR({ params }, config),
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

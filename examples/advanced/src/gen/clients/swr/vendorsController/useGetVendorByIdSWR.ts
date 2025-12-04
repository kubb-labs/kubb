import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
  GetVendorByIdPathParams,
  GetVendorByIdQueryResponse,
} from '../../../models/ts/vendorsController/GetVendorById.ts'
import { getVendorById } from '../../axios/VendorsService/getVendorById.ts'

export const getVendorByIdQueryKeySWR = ({ id }: { id: GetVendorByIdPathParams['id'] }) => [{ url: '/v1/vendors/:id', params: { id: id } }] as const

export type GetVendorByIdQueryKeySWR = ReturnType<typeof getVendorByIdQueryKeySWR>

export function getVendorByIdQueryOptionsSWR({ id }: { id: GetVendorByIdPathParams['id'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  return {
    fetcher: async () => {
      return getVendorById({ id }, config)
    },
  }
}

/**
 * @description This endpoint gets a vendor by ID.
 * @summary Get vendor
 * {@link /v1/vendors/:id}
 */
export function useGetVendorByIdSWR(
  { id }: { id: GetVendorByIdPathParams['id'] },
  options: {
    query?: Parameters<
      typeof useSWR<ResponseConfig<GetVendorByIdQueryResponse>, ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>>
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getVendorByIdQueryKeySWR({ id })

  return useSWR<
    ResponseConfig<GetVendorByIdQueryResponse>,
    ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>,
    GetVendorByIdQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...getVendorByIdQueryOptionsSWR({ id }, config),
    ...(immutable
      ? {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      : {}),
    ...queryOptions,
  })
}

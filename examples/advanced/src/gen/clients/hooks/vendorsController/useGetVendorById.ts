import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type {
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
  GetVendorByIdPathParams,
  GetVendorByIdQueryResponse,
} from '../../../models/ts/vendorsController/GetVendorById.ts'
import { getVendorById } from '../../axios/VendorsService/getVendorById.ts'

export const getVendorByIdQueryKey = ({ id }: { id: GetVendorByIdPathParams['id'] }) => [{ url: '/v1/vendors/:id', params: { id: id } }] as const

export type GetVendorByIdQueryKey = ReturnType<typeof getVendorByIdQueryKey>

export function getVendorByIdQueryOptions({ id }: { id: GetVendorByIdPathParams['id'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const queryKey = getVendorByIdQueryKey({ id })
  return queryOptions<
    ResponseConfig<GetVendorByIdQueryResponse>,
    ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>,
    ResponseConfig<GetVendorByIdQueryResponse>,
    typeof queryKey
  >({
    enabled: !!id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return getVendorById({ id }, config)
    },
  })
}

/**
 * @description This endpoint gets a vendor by ID.
 * @summary Get vendor
 * {@link /v1/vendors/:id}
 */
export function useGetVendorById<
  TData = ResponseConfig<GetVendorByIdQueryResponse>,
  TQueryData = ResponseConfig<GetVendorByIdQueryResponse>,
  TQueryKey extends QueryKey = GetVendorByIdQueryKey,
>(
  { id }: { id: GetVendorByIdPathParams['id'] },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<GetVendorByIdQueryResponse>,
        ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>,
        TData,
        TQueryData,
        TQueryKey
      >
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { query: queryConfig = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...queryOptions } = queryConfig
  const queryKey = queryOptions?.queryKey ?? getVendorByIdQueryKey({ id })

  const query = useQuery(
    {
      ...getVendorByIdQueryOptions({ id }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}

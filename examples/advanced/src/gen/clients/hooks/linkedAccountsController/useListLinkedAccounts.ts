import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { QueryClient, QueryKey, QueryObserverOptions, UseQueryResult } from '../../../../tanstack-query-hook'
import { queryOptions, useQuery } from '../../../../tanstack-query-hook'
import type {
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
  ListLinkedAccountsQueryParams,
  ListLinkedAccountsQueryResponse,
} from '../../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import { listLinkedAccounts } from '../../axios/Linked AccountsService/listLinkedAccounts.ts'

export const listLinkedAccountsQueryKey = (params?: ListLinkedAccountsQueryParams) => [{ url: '/v1/linked_accounts' }, ...(params ? [params] : [])] as const

export type ListLinkedAccountsQueryKey = ReturnType<typeof listLinkedAccountsQueryKey>

export function listLinkedAccountsQueryOptions(
  { params }: { params?: ListLinkedAccountsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const queryKey = listLinkedAccountsQueryKey(params)
  return queryOptions<
    ResponseConfig<ListLinkedAccountsQueryResponse>,
    ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>,
    ResponseConfig<ListLinkedAccountsQueryResponse>,
    typeof queryKey
  >({
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return listLinkedAccounts({ params }, config)
    },
  })
}

/**
 * @description This endpoint lists all bank connections that are eligible to make ACH transfers to Brex business account
 * @summary Lists linked accounts
 * {@link /v1/linked_accounts}
 */
export function useListLinkedAccounts<
  TData = ResponseConfig<ListLinkedAccountsQueryResponse>,
  TQueryData = ResponseConfig<ListLinkedAccountsQueryResponse>,
  TQueryKey extends QueryKey = ListLinkedAccountsQueryKey,
>(
  { params }: { params?: ListLinkedAccountsQueryParams },
  options: {
    query?: Partial<
      QueryObserverOptions<
        ResponseConfig<ListLinkedAccountsQueryResponse>,
        ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>,
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
  const queryKey = queryOptions?.queryKey ?? listLinkedAccountsQueryKey(params)

  const query = useQuery(
    {
      ...listLinkedAccountsQueryOptions({ params }, config),
      queryKey,
      ...queryOptions,
    } as unknown as QueryObserverOptions,
    queryClient,
  ) as UseQueryResult<TData, ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}

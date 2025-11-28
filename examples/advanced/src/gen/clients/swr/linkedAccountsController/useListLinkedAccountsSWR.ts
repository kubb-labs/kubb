import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  ListLinkedAccountsQueryResponse,
  ListLinkedAccountsQueryParams,
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
} from '../../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import { listLinkedAccounts } from '../../axios/Linked AccountsService/listLinkedAccounts.ts'

export const listLinkedAccountsQueryKeySWR = (params?: ListLinkedAccountsQueryParams) => [{ url: '/v1/linked_accounts' }, ...(params ? [params] : [])] as const

export type ListLinkedAccountsQueryKeySWR = ReturnType<typeof listLinkedAccountsQueryKeySWR>

export function listLinkedAccountsQueryOptionsSWR(
  { params }: { params?: ListLinkedAccountsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return listLinkedAccounts({ params }, config)
    },
  }
}

/**
 * @description This endpoint lists all bank connections that are eligible to make ACH transfers to Brex business account
 * @summary Lists linked accounts
 * {@link /v1/linked_accounts}
 */
export function useListLinkedAccountsSWR(
  { params }: { params?: ListLinkedAccountsQueryParams },
  options: {
    query?: Parameters<
      typeof useSWR<ResponseConfig<ListLinkedAccountsQueryResponse>, ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>>
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = listLinkedAccountsQueryKeySWR(params)

  return useSWR<
    ResponseConfig<ListLinkedAccountsQueryResponse>,
    ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>,
    ListLinkedAccountsQueryKeySWR | null
  >(shouldFetch ? queryKey : null, {
    ...listLinkedAccountsQueryOptionsSWR({ params }, config),
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

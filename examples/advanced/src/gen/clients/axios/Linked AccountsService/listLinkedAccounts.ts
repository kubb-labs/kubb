import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
  ListLinkedAccountsQueryParams,
  ListLinkedAccountsQueryResponse,
} from '../../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import { listLinkedAccountsQueryResponseSchema } from '../../../zod/linkedAccountsController/listLinkedAccountsSchema.ts'

export function getListLinkedAccountsUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/v1/linked_accounts' as const }
  return res
}

/**
 * @description This endpoint lists all bank connections that are eligible to make ACH transfers to Brex business account
 * @summary Lists linked accounts
 * {@link /v1/linked_accounts}
 */
export async function listLinkedAccounts(
  { params }: { params?: ListLinkedAccountsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ListLinkedAccountsQueryResponse,
    ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>,
    unknown
  >({ method: 'GET', url: getListLinkedAccountsUrl().url.toString(), params, ...requestConfig })
  return { ...res, data: listLinkedAccountsQueryResponseSchema.parse(res.data) }
}

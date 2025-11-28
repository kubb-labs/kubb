import fetch from '@kubb/plugin-client/clients/axios'
import type {
  ListLinkedAccountsQueryResponse,
  ListLinkedAccountsQueryParams,
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
} from '../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint lists all bank connections that are eligible to make ACH transfers to Brex business account
 * @summary Lists linked accounts
 * {@link /v1/linked_accounts}
 */
export async function listLinkedAccountsHandler({ params }: { params?: ListLinkedAccountsQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ListLinkedAccountsQueryResponse, ResponseErrorConfig<ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403>, unknown>(
    { method: 'GET', url: '/v1/linked_accounts', baseURL: 'https://petstore.swagger.io/v2', params },
  )
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

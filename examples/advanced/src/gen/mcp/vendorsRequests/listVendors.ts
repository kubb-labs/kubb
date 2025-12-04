import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  ListVendors400,
  ListVendors401,
  ListVendors403,
  ListVendorsQueryParams,
  ListVendorsQueryResponse,
} from '../../models/ts/vendorsController/ListVendors.ts'

/**
 * @description This endpoint lists all existing vendors for an account.Takes an optional parameter to match by vendor name.
 * @summary Lists vendors
 * {@link /v1/vendors}
 */
export async function listVendorsHandler({ params }: { params?: ListVendorsQueryParams }): Promise<Promise<CallToolResult>> {
  const res = await fetch<ListVendorsQueryResponse, ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>, unknown>({
    method: 'GET',
    url: '/v1/vendors',
    baseURL: 'https://petstore.swagger.io/v2',
    params,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

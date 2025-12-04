import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  ListVendors400,
  ListVendors401,
  ListVendors403,
  ListVendorsQueryParams,
  ListVendorsQueryResponse,
} from '../../../models/ts/vendorsController/ListVendors.ts'
import { listVendorsQueryResponseSchema } from '../../../zod/vendorsController/listVendorsSchema.ts'

export function getListVendorsUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/v1/vendors' as const }
  return res
}

/**
 * @description This endpoint lists all existing vendors for an account.Takes an optional parameter to match by vendor name.
 * @summary Lists vendors
 * {@link /v1/vendors}
 */
export async function listVendors({ params }: { params?: ListVendorsQueryParams }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<ListVendorsQueryResponse, ResponseErrorConfig<ListVendors400 | ListVendors401 | ListVendors403>, unknown>({
    method: 'GET',
    url: getListVendorsUrl().url.toString(),
    params,
    ...requestConfig,
  })
  return { ...res, data: listVendorsQueryResponseSchema.parse(res.data) }
}

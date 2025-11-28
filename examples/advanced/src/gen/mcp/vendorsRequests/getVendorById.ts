import fetch from '@kubb/plugin-client/clients/axios'
import type {
  GetVendorByIdQueryResponse,
  GetVendorByIdPathParams,
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
} from '../../models/ts/vendorsController/GetVendorById.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint gets a vendor by ID.
 * @summary Get vendor
 * {@link /v1/vendors/:id}
 */
export async function getVendorByIdHandler({ id }: { id: GetVendorByIdPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetVendorByIdQueryResponse, ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>, unknown>({
    method: 'GET',
    url: `/v1/vendors/${id}`,
    baseURL: 'https://petstore.swagger.io/v2',
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

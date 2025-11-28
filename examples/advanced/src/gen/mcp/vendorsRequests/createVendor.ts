import fetch from '@kubb/plugin-client/clients/axios'
import type { CreateVendorMutationRequest, CreateVendorMutationResponse, CreateVendorHeaderParams } from '../../models/ts/vendorsController/CreateVendor.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint creates a new vendor.
 * @summary Create vendor
 * {@link /v1/vendors}
 */
export async function createVendorHandler({
  data,
  headers,
}: {
  data: CreateVendorMutationRequest
  headers: CreateVendorHeaderParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateVendorMutationResponse, ResponseErrorConfig<Error>, CreateVendorMutationRequest>({
    method: 'POST',
    url: '/v1/vendors',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
    headers: { ...headers },
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

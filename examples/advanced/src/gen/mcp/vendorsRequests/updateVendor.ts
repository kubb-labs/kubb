import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  UpdateVendorHeaderParams,
  UpdateVendorMutationRequest,
  UpdateVendorMutationResponse,
  UpdateVendorPathParams,
} from '../../models/ts/vendorsController/UpdateVendor.ts'

/**
 * @description     Updates an existing vendor by ID.
 * @summary Update vendor
 * {@link /v1/vendors/:id}
 */
export async function updateVendorHandler({
  id,
  data,
  headers,
}: {
  id: UpdateVendorPathParams['id']
  data?: UpdateVendorMutationRequest
  headers?: UpdateVendorHeaderParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<UpdateVendorMutationResponse, ResponseErrorConfig<Error>, UpdateVendorMutationRequest>({
    method: 'PUT',
    url: `/v1/vendors/${id}`,
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

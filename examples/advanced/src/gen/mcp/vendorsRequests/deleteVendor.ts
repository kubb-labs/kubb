import fetch from '@kubb/plugin-client/clients/axios'
import type { DeleteVendorMutationResponse, DeleteVendorPathParams } from '../../models/ts/vendorsController/DeleteVendor.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This endpoint deletes a vendor by ID.
 * @summary Delete vendor.
 * {@link /v1/vendors/:id}
 */
export async function deleteVendorHandler({ id }: { id: DeleteVendorPathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeleteVendorMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
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

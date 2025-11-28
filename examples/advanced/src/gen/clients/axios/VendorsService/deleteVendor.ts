import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteVendorMutationResponse, DeleteVendorPathParams } from '../../../models/ts/vendorsController/DeleteVendor.ts'
import { deleteVendorMutationResponseSchema } from '../../../zod/vendorsController/deleteVendorSchema.ts'

export function getDeleteVendorUrl({ id }: { id: DeleteVendorPathParams['id'] }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/v1/vendors/${id}` as const }
  return res
}

/**
 * @description This endpoint deletes a vendor by ID.
 * @summary Delete vendor.
 * {@link /v1/vendors/:id}
 */
export async function deleteVendor({ id }: { id: DeleteVendorPathParams['id'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeleteVendorMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getDeleteVendorUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: deleteVendorMutationResponseSchema.parse(res.data) }
}

import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  UpdateVendorHeaderParams,
  UpdateVendorMutationRequest,
  UpdateVendorMutationResponse,
  UpdateVendorPathParams,
} from '../../../models/ts/vendorsController/UpdateVendor.ts'
import { updateVendorMutationRequestSchema, updateVendorMutationResponseSchema } from '../../../zod/vendorsController/updateVendorSchema.ts'

export function getUpdateVendorUrl({ id }: { id: UpdateVendorPathParams['id'] }) {
  const res = { method: 'PUT', url: `https://petstore3.swagger.io/api/v3/v1/vendors/${id}` as const }
  return res
}

/**
 * @description     Updates an existing vendor by ID.
 * @summary Update vendor
 * {@link /v1/vendors/:id}
 */
export async function updateVendor(
  { id, data, headers }: { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
  config: Partial<RequestConfig<UpdateVendorMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = updateVendorMutationRequestSchema.parse(data)

  const res = await request<UpdateVendorMutationResponse, ResponseErrorConfig<Error>, UpdateVendorMutationRequest>({
    method: 'PUT',
    url: getUpdateVendorUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: updateVendorMutationResponseSchema.parse(res.data) }
}

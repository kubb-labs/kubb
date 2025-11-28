import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateVendorMutationRequest, CreateVendorMutationResponse, CreateVendorHeaderParams } from '../../../models/ts/vendorsController/CreateVendor.ts'
import { createVendorMutationResponseSchema, createVendorMutationRequestSchema } from '../../../zod/vendorsController/createVendorSchema.ts'

export function getCreateVendorUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/v1/vendors' as const }
  return res
}

/**
 * @description This endpoint creates a new vendor.
 * @summary Create vendor
 * {@link /v1/vendors}
 */
export async function createVendor(
  { data, headers }: { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
  config: Partial<RequestConfig<CreateVendorMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createVendorMutationRequestSchema.parse(data)

  const res = await request<CreateVendorMutationResponse, ResponseErrorConfig<Error>, CreateVendorMutationRequest>({
    method: 'POST',
    url: getCreateVendorUrl().url.toString(),
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createVendorMutationResponseSchema.parse(res.data) }
}

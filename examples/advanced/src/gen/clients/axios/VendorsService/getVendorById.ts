import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
  GetVendorByIdPathParams,
  GetVendorByIdQueryResponse,
} from '../../../models/ts/vendorsController/GetVendorById.ts'
import { getVendorByIdQueryResponseSchema } from '../../../zod/vendorsController/getVendorByIdSchema.ts'

export function getGetVendorByIdUrl({ id }: { id: GetVendorByIdPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/v1/vendors/${id}` as const }
  return res
}

/**
 * @description This endpoint gets a vendor by ID.
 * @summary Get vendor
 * {@link /v1/vendors/:id}
 */
export async function getVendorById({ id }: { id: GetVendorByIdPathParams['id'] }, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetVendorByIdQueryResponse,
    ResponseErrorConfig<GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500>,
    unknown
  >({ method: 'GET', url: getGetVendorByIdUrl({ id }).url.toString(), ...requestConfig })
  return { ...res, data: getVendorByIdQueryResponseSchema.parse(res.data) }
}

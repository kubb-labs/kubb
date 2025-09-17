import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerGetActiveLicenseQueryResponse,
  TenantsControllerGetActiveLicensePathParams,
} from '../../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import { tenantsControllerGetActiveLicenseQueryResponseSchema } from '../../../zod/tenantsController/tenantsControllerGetActiveLicenseSchema.ts'

export function getTenantsControllerGetActiveLicenseUrl({ id }: { id: TenantsControllerGetActiveLicensePathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/tenants/${id}/active-license` as const }
  return res
}

/**
 * {@link /api/tenants/:id/active-license}
 */
export async function tenantsControllerGetActiveLicense(
  { id }: { id: TenantsControllerGetActiveLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<TenantsControllerGetActiveLicenseQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getTenantsControllerGetActiveLicenseUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: tenantsControllerGetActiveLicenseQueryResponseSchema.parse(res.data) }
}

import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerGetLicenseQueryResponse,
  LicensesControllerGetLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import { licensesControllerGetLicenseQueryResponseSchema } from '../../../zod/licensesController/licensesControllerGetLicenseSchema.ts'

export function getLicensesControllerGetLicenseUrl({ id }: { id: LicensesControllerGetLicensePathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/licenses/${id}` as const }
  return res
}

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerGetLicense(
  { id }: { id: LicensesControllerGetLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LicensesControllerGetLicenseQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLicensesControllerGetLicenseUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: licensesControllerGetLicenseQueryResponseSchema.parse(res.data) }
}

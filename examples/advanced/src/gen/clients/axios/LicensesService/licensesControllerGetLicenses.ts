import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LicensesControllerGetLicensesQueryResponse } from '../../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import { licensesControllerGetLicensesQueryResponseSchema } from '../../../zod/licensesController/licensesControllerGetLicensesSchema.ts'

export function getLicensesControllerGetLicensesUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/licenses' as const }
  return res
}

/**
 * {@link /api/licenses}
 */
export async function licensesControllerGetLicenses(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LicensesControllerGetLicensesQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLicensesControllerGetLicensesUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: licensesControllerGetLicensesQueryResponseSchema.parse(res.data) }
}

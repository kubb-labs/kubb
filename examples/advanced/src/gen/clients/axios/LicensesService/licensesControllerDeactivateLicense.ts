import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeactivateLicenseMutationResponse,
  LicensesControllerDeactivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import { licensesControllerDeactivateLicenseMutationResponseSchema } from '../../../zod/licensesController/licensesControllerDeactivateLicenseSchema.ts'

export function getLicensesControllerDeactivateLicenseUrl({ id }: { id: LicensesControllerDeactivateLicensePathParams['id'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/licenses/${id}/deactivate` as const }
  return res
}

/**
 * {@link /api/licenses/:id/deactivate}
 */
export async function licensesControllerDeactivateLicense(
  { id }: { id: LicensesControllerDeactivateLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LicensesControllerDeactivateLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getLicensesControllerDeactivateLicenseUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: licensesControllerDeactivateLicenseMutationResponseSchema.parse(res.data) }
}

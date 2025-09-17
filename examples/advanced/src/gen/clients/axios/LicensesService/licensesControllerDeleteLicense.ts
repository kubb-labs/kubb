import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeleteLicenseMutationResponse,
  LicensesControllerDeleteLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import { licensesControllerDeleteLicenseMutationResponseSchema } from '../../../zod/licensesController/licensesControllerDeleteLicenseSchema.ts'

export function getLicensesControllerDeleteLicenseUrl({ id }: { id: LicensesControllerDeleteLicensePathParams['id'] }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/api/licenses/${id}` as const }
  return res
}

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerDeleteLicense(
  { id }: { id: LicensesControllerDeleteLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LicensesControllerDeleteLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getLicensesControllerDeleteLicenseUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: licensesControllerDeleteLicenseMutationResponseSchema.parse(res.data) }
}

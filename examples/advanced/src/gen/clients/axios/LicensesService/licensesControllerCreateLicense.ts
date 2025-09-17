import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import {
  licensesControllerCreateLicenseMutationResponseSchema,
  licensesControllerCreateLicenseMutationRequestSchema,
} from '../../../zod/licensesController/licensesControllerCreateLicenseSchema.ts'

export function getLicensesControllerCreateLicenseUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/api/licenses' as const }
  return res
}

/**
 * {@link /api/licenses}
 */
export async function licensesControllerCreateLicense(
  { data }: { data: LicensesControllerCreateLicenseMutationRequest },
  config: Partial<RequestConfig<LicensesControllerCreateLicenseMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = licensesControllerCreateLicenseMutationRequestSchema.parse(data)

  const res = await request<LicensesControllerCreateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerCreateLicenseMutationRequest>({
    method: 'POST',
    url: getLicensesControllerCreateLicenseUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: licensesControllerCreateLicenseMutationResponseSchema.parse(res.data) }
}

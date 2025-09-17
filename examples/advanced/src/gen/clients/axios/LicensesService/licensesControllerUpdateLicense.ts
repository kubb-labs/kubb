import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
  LicensesControllerUpdateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import {
  licensesControllerUpdateLicenseMutationResponseSchema,
  licensesControllerUpdateLicenseMutationRequestSchema,
} from '../../../zod/licensesController/licensesControllerUpdateLicenseSchema.ts'

export function getLicensesControllerUpdateLicenseUrl({ id }: { id: LicensesControllerUpdateLicensePathParams['id'] }) {
  const res = { method: 'PATCH', url: `https://petstore3.swagger.io/api/v3/api/licenses/${id}` as const }
  return res
}

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerUpdateLicense(
  { id, data }: { id: LicensesControllerUpdateLicensePathParams['id']; data: LicensesControllerUpdateLicenseMutationRequest },
  config: Partial<RequestConfig<LicensesControllerUpdateLicenseMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = licensesControllerUpdateLicenseMutationRequestSchema.parse(data)

  const res = await request<LicensesControllerUpdateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerUpdateLicenseMutationRequest>({
    method: 'PATCH',
    url: getLicensesControllerUpdateLicenseUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: licensesControllerUpdateLicenseMutationResponseSchema.parse(res.data) }
}

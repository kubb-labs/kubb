import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
  LicensesControllerActivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import {
  licensesControllerActivateLicenseMutationResponseSchema,
  licensesControllerActivateLicenseMutationRequestSchema,
} from '../../../zod/licensesController/licensesControllerActivateLicenseSchema.ts'

export function getLicensesControllerActivateLicenseUrl({ id }: { id: LicensesControllerActivateLicensePathParams['id'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/licenses/${id}/activate` as const }
  return res
}

/**
 * {@link /api/licenses/:id/activate}
 */
export async function licensesControllerActivateLicense(
  { id, data }: { id: LicensesControllerActivateLicensePathParams['id']; data: LicensesControllerActivateLicenseMutationRequest },
  config: Partial<RequestConfig<LicensesControllerActivateLicenseMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = licensesControllerActivateLicenseMutationRequestSchema.parse(data)

  const res = await request<LicensesControllerActivateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerActivateLicenseMutationRequest>({
    method: 'POST',
    url: getLicensesControllerActivateLicenseUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: licensesControllerActivateLicenseMutationResponseSchema.parse(res.data) }
}

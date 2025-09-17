import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
  LicensesControllerUpdateLicensePathParams,
} from '../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerUpdateLicenseHandler({
  id,
  data,
}: {
  id: LicensesControllerUpdateLicensePathParams['id']
  data: LicensesControllerUpdateLicenseMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<LicensesControllerUpdateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerUpdateLicenseMutationRequest>({
    method: 'PATCH',
    url: `/api/licenses/${id}`,
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

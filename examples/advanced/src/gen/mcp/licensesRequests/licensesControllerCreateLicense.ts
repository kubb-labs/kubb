import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses}
 */
export async function licensesControllerCreateLicenseHandler({
  data,
}: {
  data: LicensesControllerCreateLicenseMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<LicensesControllerCreateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerCreateLicenseMutationRequest>({
    method: 'POST',
    url: '/api/licenses',
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

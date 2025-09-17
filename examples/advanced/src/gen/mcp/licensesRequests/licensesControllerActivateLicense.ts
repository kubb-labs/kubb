import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
  LicensesControllerActivateLicensePathParams,
} from '../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses/:id/activate}
 */
export async function licensesControllerActivateLicenseHandler({
  id,
  data,
}: {
  id: LicensesControllerActivateLicensePathParams['id']
  data: LicensesControllerActivateLicenseMutationRequest
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<LicensesControllerActivateLicenseMutationResponse, ResponseErrorConfig<Error>, LicensesControllerActivateLicenseMutationRequest>({
    method: 'POST',
    url: `/api/licenses/${id}/activate`,
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

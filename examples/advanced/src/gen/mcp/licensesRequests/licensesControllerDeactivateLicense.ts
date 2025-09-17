import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerDeactivateLicenseMutationResponse,
  LicensesControllerDeactivateLicensePathParams,
} from '../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses/:id/deactivate}
 */
export async function licensesControllerDeactivateLicenseHandler({
  id,
}: {
  id: LicensesControllerDeactivateLicensePathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<LicensesControllerDeactivateLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: `/api/licenses/${id}/deactivate`,
    baseURL: 'https://petstore.swagger.io/v2',
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

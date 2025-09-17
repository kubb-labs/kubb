import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerDeleteLicenseMutationResponse,
  LicensesControllerDeleteLicensePathParams,
} from '../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerDeleteLicenseHandler({
  id,
}: {
  id: LicensesControllerDeleteLicensePathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<LicensesControllerDeleteLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: `/api/licenses/${id}`,
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

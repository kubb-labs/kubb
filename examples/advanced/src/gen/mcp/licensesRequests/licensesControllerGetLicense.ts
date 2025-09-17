import fetch from '@kubb/plugin-client/clients/axios'
import type {
  LicensesControllerGetLicenseQueryResponse,
  LicensesControllerGetLicensePathParams,
} from '../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses/:id}
 */
export async function licensesControllerGetLicenseHandler({ id }: { id: LicensesControllerGetLicensePathParams['id'] }): Promise<Promise<CallToolResult>> {
  const res = await fetch<LicensesControllerGetLicenseQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
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

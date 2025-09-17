import fetch from '@kubb/plugin-client/clients/axios'
import type { LicensesControllerGetLicensesQueryResponse } from '../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/licenses}
 */
export async function licensesControllerGetLicensesHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<LicensesControllerGetLicensesQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/licenses',
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

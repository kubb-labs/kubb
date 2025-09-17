import fetch from '@kubb/plugin-client/clients/axios'
import type { AppControllerGetStatusQueryResponse } from '../../models/ts/appController/AppControllerGetStatus.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/status}
 */
export async function appControllerGetStatusHandler(): Promise<Promise<CallToolResult>> {
  const res = await fetch<AppControllerGetStatusQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: '/api/status',
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

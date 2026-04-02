import type { ResponseErrorConfig } from './.kubb/fetch'
import type { GetPetsQueryLimit, GetPetsResponse } from './GetPets'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './.kubb/fetch'

/**
 * {@link /pets}
 */
export async function getPetsHandler({ params }: { params?: { limit?: GetPetsQueryLimit } } = {}): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetPetsResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets`, baseURL: `${123456}`, params })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}

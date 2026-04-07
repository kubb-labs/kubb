import type { ResponseErrorConfig } from './.kubb/fetch'
import type { CreatePetsData, CreatePetsResponse } from './CreatePets'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { fetch } from './.kubb/fetch'

/**
 * {@link /pets}
 */
export async function createPetsHandler({ data }: { data?: CreatePetsData } = {}): Promise<Promise<CallToolResult>> {
  const requestData = data
  const res = await fetch<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>({ method: 'POST', url: `/pets`, data: requestData })
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

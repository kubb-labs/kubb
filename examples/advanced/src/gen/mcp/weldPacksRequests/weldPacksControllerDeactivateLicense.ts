import fetch from '@kubb/plugin-client/clients/axios'
import type {
  WeldPacksControllerDeactivateLicenseMutationResponse,
  WeldPacksControllerDeactivateLicensePathParams,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * {@link /api/weldpacks/:id/deactivate}
 */
export async function weldPacksControllerDeactivateLicenseHandler({
  id,
}: {
  id: WeldPacksControllerDeactivateLicensePathParams['id']
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<WeldPacksControllerDeactivateLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: `/api/weldpacks/${id}/deactivate`,
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

import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import { weldPacksControllerGetWeldPacksQueryResponseSchema } from '../../../zod/weldPacksController/weldPacksControllerGetWeldPacksSchema.ts'

export function getWeldPacksControllerGetWeldPacksUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/weldpacks' as const }
  return res
}

/**
 * {@link /api/weldpacks}
 */
export async function weldPacksControllerGetWeldPacks(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<WeldPacksControllerGetWeldPacksQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getWeldPacksControllerGetWeldPacksUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerGetWeldPacksQueryResponseSchema.parse(res.data) }
}

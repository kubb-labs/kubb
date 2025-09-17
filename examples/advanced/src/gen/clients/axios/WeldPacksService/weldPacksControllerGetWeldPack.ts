import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerGetWeldPackQueryResponse,
  WeldPacksControllerGetWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import { weldPacksControllerGetWeldPackQueryResponseSchema } from '../../../zod/weldPacksController/weldPacksControllerGetWeldPackSchema.ts'

export function getWeldPacksControllerGetWeldPackUrl({ id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/api/weldpacks/${id}` as const }
  return res
}

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerGetWeldPack(
  { id }: { id: WeldPacksControllerGetWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<WeldPacksControllerGetWeldPackQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getWeldPacksControllerGetWeldPackUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerGetWeldPackQueryResponseSchema.parse(res.data) }
}

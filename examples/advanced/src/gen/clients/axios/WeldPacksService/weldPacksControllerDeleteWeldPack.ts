import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeleteWeldPackMutationResponse,
  WeldPacksControllerDeleteWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import { weldPacksControllerDeleteWeldPackMutationResponseSchema } from '../../../zod/weldPacksController/weldPacksControllerDeleteWeldPackSchema.ts'

export function getWeldPacksControllerDeleteWeldPackUrl({ id }: { id: WeldPacksControllerDeleteWeldPackPathParams['id'] }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/api/weldpacks/${id}` as const }
  return res
}

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerDeleteWeldPack(
  { id }: { id: WeldPacksControllerDeleteWeldPackPathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<WeldPacksControllerDeleteWeldPackMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getWeldPacksControllerDeleteWeldPackUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerDeleteWeldPackMutationResponseSchema.parse(res.data) }
}

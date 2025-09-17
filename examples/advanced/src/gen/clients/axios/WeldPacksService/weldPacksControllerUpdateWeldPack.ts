import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
  WeldPacksControllerUpdateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import {
  weldPacksControllerUpdateWeldPackMutationResponseSchema,
  weldPacksControllerUpdateWeldPackMutationRequestSchema,
} from '../../../zod/weldPacksController/weldPacksControllerUpdateWeldPackSchema.ts'

export function getWeldPacksControllerUpdateWeldPackUrl({ id }: { id: WeldPacksControllerUpdateWeldPackPathParams['id'] }) {
  const res = { method: 'PATCH', url: `https://petstore3.swagger.io/api/v3/api/weldpacks/${id}` as const }
  return res
}

/**
 * {@link /api/weldpacks/:id}
 */
export async function weldPacksControllerUpdateWeldPack(
  { id, data }: { id: WeldPacksControllerUpdateWeldPackPathParams['id']; data: WeldPacksControllerUpdateWeldPackMutationRequest },
  config: Partial<RequestConfig<WeldPacksControllerUpdateWeldPackMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = weldPacksControllerUpdateWeldPackMutationRequestSchema.parse(data)

  const res = await request<WeldPacksControllerUpdateWeldPackMutationResponse, ResponseErrorConfig<Error>, WeldPacksControllerUpdateWeldPackMutationRequest>({
    method: 'PATCH',
    url: getWeldPacksControllerUpdateWeldPackUrl({ id }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerUpdateWeldPackMutationResponseSchema.parse(res.data) }
}

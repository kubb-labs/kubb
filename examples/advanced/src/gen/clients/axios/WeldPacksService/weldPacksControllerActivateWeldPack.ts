import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
  WeldPacksControllerActivateWeldPackPathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import {
  weldPacksControllerActivateWeldPackMutationResponseSchema,
  weldPacksControllerActivateWeldPackMutationRequestSchema,
} from '../../../zod/weldPacksController/weldPacksControllerActivateWeldPackSchema.ts'

export function getWeldPacksControllerActivateWeldPackUrl({ id }: { id: WeldPacksControllerActivateWeldPackPathParams['id'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/weldpacks/${id}/activate` as const }
  return res
}

/**
 * {@link /api/weldpacks/:id/activate}
 */
export async function weldPacksControllerActivateWeldPack(
  { id, data }: { id: WeldPacksControllerActivateWeldPackPathParams['id']; data: WeldPacksControllerActivateWeldPackMutationRequest },
  config: Partial<RequestConfig<WeldPacksControllerActivateWeldPackMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = weldPacksControllerActivateWeldPackMutationRequestSchema.parse(data)

  const res = await request<
    WeldPacksControllerActivateWeldPackMutationResponse,
    ResponseErrorConfig<Error>,
    WeldPacksControllerActivateWeldPackMutationRequest
  >({ method: 'POST', url: getWeldPacksControllerActivateWeldPackUrl({ id }).url.toString(), data: requestData, ...requestConfig })
  return { ...res, data: weldPacksControllerActivateWeldPackMutationResponseSchema.parse(res.data) }
}

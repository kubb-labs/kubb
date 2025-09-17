import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import {
  weldPacksControllerCreateWeldPackMutationResponseSchema,
  weldPacksControllerCreateWeldPackMutationRequestSchema,
} from '../../../zod/weldPacksController/weldPacksControllerCreateWeldPackSchema.ts'

export function getWeldPacksControllerCreateWeldPackUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/api/weldpacks' as const }
  return res
}

/**
 * {@link /api/weldpacks}
 */
export async function weldPacksControllerCreateWeldPack(
  { data }: { data: WeldPacksControllerCreateWeldPackMutationRequest },
  config: Partial<RequestConfig<WeldPacksControllerCreateWeldPackMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = weldPacksControllerCreateWeldPackMutationRequestSchema.parse(data)

  const res = await request<WeldPacksControllerCreateWeldPackMutationResponse, ResponseErrorConfig<Error>, WeldPacksControllerCreateWeldPackMutationRequest>({
    method: 'POST',
    url: getWeldPacksControllerCreateWeldPackUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerCreateWeldPackMutationResponseSchema.parse(res.data) }
}

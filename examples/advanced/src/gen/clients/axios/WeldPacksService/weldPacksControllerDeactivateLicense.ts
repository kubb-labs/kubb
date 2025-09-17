import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeactivateLicenseMutationResponse,
  WeldPacksControllerDeactivateLicensePathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import { weldPacksControllerDeactivateLicenseMutationResponseSchema } from '../../../zod/weldPacksController/weldPacksControllerDeactivateLicenseSchema.ts'

export function getWeldPacksControllerDeactivateLicenseUrl({ id }: { id: WeldPacksControllerDeactivateLicensePathParams['id'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/api/weldpacks/${id}/deactivate` as const }
  return res
}

/**
 * {@link /api/weldpacks/:id/deactivate}
 */
export async function weldPacksControllerDeactivateLicense(
  { id }: { id: WeldPacksControllerDeactivateLicensePathParams['id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<WeldPacksControllerDeactivateLicenseMutationResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getWeldPacksControllerDeactivateLicenseUrl({ id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: weldPacksControllerDeactivateLicenseMutationResponseSchema.parse(res.data) }
}

import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AppControllerGetStatusQueryResponse } from '../../../models/ts/appController/AppControllerGetStatus.ts'
import { appControllerGetStatusQueryResponseSchema } from '../../../zod/appController/appControllerGetStatusSchema.ts'

export function getAppControllerGetStatusUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/api/status' as const }
  return res
}

/**
 * {@link /api/status}
 */
export async function appControllerGetStatus(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<AppControllerGetStatusQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getAppControllerGetStatusUrl().url.toString(),
    ...requestConfig,
  })
  return { ...res, data: appControllerGetStatusQueryResponseSchema.parse(res.data) }
}

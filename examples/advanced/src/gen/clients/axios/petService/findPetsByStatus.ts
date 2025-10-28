import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

export function getFindPetsByStatusUrl({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/findByStatus/${step_id}` as const }
  return res
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatus(
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl({ step_id }).url.toString(),
    ...requestConfig,
  })
  return { ...res, data: findPetsByStatusQueryResponseSchema.parse(res.data) }
}

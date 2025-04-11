import client from '@kubb/plugin-client/clients/fetch'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getFindPetsByStatusUrl() {
  return '/pet/findByStatus' as const
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl().toString(),
    params,
    ...requestConfig,
  })
  return res.data
}

/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusQueryParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.js'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: FindPetsByStatusQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({ method: 'GET', url: '/pet/findByStatus', params, ...config })
  return res.data
}

import client from '@kubb/plugin-client/clients/fetch'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getCreateUsersWithListInputUrl() {
  return new URL('/user/createWithList')
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().toString(),
    data,
    ...config,
  })
  return res.data
}

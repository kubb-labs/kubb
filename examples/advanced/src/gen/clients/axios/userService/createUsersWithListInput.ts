import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import {
  createUsersWithListInputMutationResponseSchema,
  createUsersWithListInputMutationRequestSchema,
} from '../../../zod/userController/createUsersWithListInputSchema.ts'

export function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/user/createWithList' as const }
  return res
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  { data }: { data?: CreateUsersWithListInputMutationRequest },
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createUsersWithListInputMutationRequestSchema.parse(data)
  const res = await request<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: createUsersWithListInputMutationResponseSchema.parse(res.data) }
}
